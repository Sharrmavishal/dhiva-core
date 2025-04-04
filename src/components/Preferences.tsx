import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Clock, Check, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const WEEKDAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (8 AM)', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon (2 PM)', icon: '☀️' },
  { id: 'evening', label: 'Evening (7 PM)', icon: '🌆' },
];

function Preferences() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryModes, setDeliveryModes] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeliveryModeToggle = (mode: string) => {
    setDeliveryModes(prev => 
      prev.includes(mode) 
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSkipWeekendsToggle = () => {
    setSkipWeekends(prev => !prev);
    if (!skipWeekends) {
      setSelectedDays(prev => prev.filter(day => !['sat', 'sun'].includes(day)));
    }
  };

  const validateForm = () => {
    if (!email) return 'Email is required';
    if (!deliveryModes.length) return 'Please select at least one delivery method';
    if (deliveryModes.includes('whatsapp') && !phoneNumber) return 'Phone number is required for WhatsApp delivery';
    if (frequency === 'custom' && !selectedDays.length) return 'Please select at least one day';
    if (!consent) return 'Please agree to the Terms of Use and Privacy Policy';
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update user's terms acceptance
      await supabase.auth.updateUser({
        data: { accepted_terms_at: new Date().toISOString() }
      });

      // Log consent
      await supabase
        .from('consent_logs')
        .insert([
          {
            user_id: user.id,
            type: 'terms',
            details: {
              accepted_at: new Date().toISOString(),
              delivery_modes: deliveryModes
            }
          }
        ]);

      // Save preferences
      const { error: prefsError } = await supabase
        .from('preferences')
        .insert([
          {
            email,
            phone_number: phoneNumber,
            delivery_modes: deliveryModes,
            frequency,
            custom_days: selectedDays,
            time_of_day: timeOfDay,
            consent_given: consent,
          },
        ]);

      if (prefsError) throw prefsError;

      // If WhatsApp selected, send initial consent message
      if (deliveryModes.includes('whatsapp')) {
        await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            phoneNumber,
            message: `Hi 👋 Welcome to Dhiva. By continuing, you agree to our Terms of Use and Privacy Policy. Your learning is powered by AI. Reply YES to continue.

📜 https://dhiva.co/terms
🔐 https://dhiva.co/privacy
🤖 https://dhiva.co/ai-disclosure`,
            command: 'WELCOME'
          }),
        });
      }

      navigate('/success');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Clock className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Set Your Learning Schedule
            </h1>
            <p className="text-lg text-gray-600">
              Choose when and how you'd like to receive your Natraris microlearnings.
            </p>
          </div>

          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Methods</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleDeliveryModeToggle('email')}
                  className={`p-4 rounded-lg border ${
                    deliveryModes.includes('email')
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <Mail className={`h-6 w-6 ${
                    deliveryModes.includes('email') ? 'text-indigo-600' : 'text-gray-400'
                  } mb-2`} />
                  <h3 className="font-medium">Email Delivery</h3>
                  <p className="text-sm text-gray-500">Detailed lessons in your inbox</p>
                </button>
                <button
                  onClick={() => handleDeliveryModeToggle('whatsapp')}
                  className={`p-4 rounded-lg border ${
                    deliveryModes.includes('whatsapp')
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <MessageSquare className={`h-6 w-6 ${
                    deliveryModes.includes('whatsapp') ? 'text-indigo-600' : 'text-gray-400'
                  } mb-2`} />
                  <h3 className="font-medium">WhatsApp Delivery</h3>
                  <p className="text-sm text-gray-500">Quick bytes on the go</p>
                </button>
              </div>
            </div>

            {/* Frequency */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Schedule</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                    How often would you like to receive content?
                  </label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="alternate">Alternate Days</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>

                {frequency === 'custom' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => (
                          <button
                            key={day.id}
                            onClick={() => handleDayToggle(day.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                              ${selectedDays.includes(day.id)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="skipWeekends"
                        checked={skipWeekends}
                        onChange={handleSkipWeekendsToggle}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="skipWeekends" className="ml-2 text-sm text-gray-700">
                        Skip weekends
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time of Day
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setTimeOfDay(slot.id)}
                        className={`p-3 rounded-lg border text-left ${
                          timeOfDay === slot.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                        } transition-colors`}
                      >
                        <span className="text-lg mr-2">{slot.icon}</span>
                        <span className="font-medium">{slot.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Consent */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-indigo-600 hover:text-indigo-500" target="_blank">
                    Terms of Use
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500" target="_blank">
                    Privacy Policy
                  </Link>
                  . I understand that my learning experience will be powered by AI as described in the{' '}
                  <Link to="/ai-disclosure" className="text-indigo-600 hover:text-indigo-500" target="_blank">
                    AI Disclosure
                  </Link>
                  .
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
                hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition
                flex items-center justify-center"
            >
              {isSubmitting ? (
                'Saving preferences...'
              ) : (
                <>
                  Start Learning
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Preferences;