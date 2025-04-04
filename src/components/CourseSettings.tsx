import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, QrCode, Copy, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Course {
  id: string;
  title: string;
  is_public: boolean;
  public_id: string;
  qr_link: string | null;
  delivery_channel: 'whatsapp' | 'email' | 'both';
}

function CourseSettings() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState<'whatsapp' | 'email' | 'both'>('both');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading course:', error);
      return;
    }

    setCourse(data);
    setIsPublic(data.is_public);
    setDeliveryChannel(data.delivery_channel);
  };

  const handlePublicToggle = async () => {
    if (!course) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          is_public: !isPublic,
          delivery_channel: deliveryChannel,
        })
        .eq('id', course.id);

      if (error) throw error;

      setIsPublic(!isPublic);
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update sharing settings');
    }
  };

  const handleDeliveryChannelChange = async (channel: 'whatsapp' | 'email' | 'both') => {
    if (!course) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({ delivery_channel: channel })
        .eq('id', course.id);

      if (error) throw error;

      setDeliveryChannel(channel);
    } catch (error) {
      console.error('Error updating delivery channel:', error);
      alert('Failed to update delivery channel');
    }
  };

  const generateQRCode = async () => {
    if (!course) return;

    setIsGeneratingQR(true);
    try {
      const publicUrl = `https://nataris.ai/c/${course.public_id}`;
      
      // Use a QR code service (e.g., QRServer)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;
      
      const { error } = await supabase
        .from('courses')
        .update({ qr_link: qrUrl })
        .eq('id', course.id);

      if (error) throw error;

      setCourse({ ...course, qr_link: qrUrl });
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const copyPublicLink = async () => {
    if (!course) return;

    const publicUrl = `https://nataris.ai/c/${course.public_id}`;
    await navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Sharing Settings
        </h2>
      </div>

      {/* Public Toggle */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={handlePublicToggle}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2">Make this course publicly shareable</span>
        </label>
      </div>

      {isPublic && (
        <>
          {/* Delivery Channels */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Channels
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={deliveryChannel === 'both'}
                  onChange={() => handleDeliveryChannelChange('both')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2">Both WhatsApp and Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={deliveryChannel === 'whatsapp'}
                  onChange={() => handleDeliveryChannelChange('whatsapp')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2">WhatsApp Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={deliveryChannel === 'email'}
                  onChange={() => handleDeliveryChannelChange('email')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2">Email Only</span>
              </label>
            </div>
          </div>

          {/* Public Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`https://nataris.ai/c/${course.public_id}`}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50"
              />
              <button
                onClick={copyPublicLink}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                {isCopied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code
            </label>
            {course.qr_link ? (
              <div className="mb-4">
                <img
                  src={course.qr_link}
                  alt="Course QR Code"
                  className="w-48 h-48 border rounded-lg"
                />
              </div>
            ) : (
              <button
                onClick={generateQRCode}
                disabled={isGeneratingQR}
                className="flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <QrCode className="h-5 w-5 mr-2" />
                {isGeneratingQR ? 'Generating...' : 'Generate QR Code'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CourseSettings;