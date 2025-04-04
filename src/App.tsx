import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Brain, Mail, MessageSquare, FileText, ChevronRight, Star, Clock, BarChart } from 'lucide-react';
import TopicSelection from './components/TopicSelection';
import Quiz from './components/Quiz';
import LearningPlan from './components/LearningPlan';
import Preferences from './components/Preferences';
import CourseCreator from './components/CourseCreator';
import CoursePreview from './components/CoursePreview';
import CourseSettings from './components/CourseSettings';
import PublicCourseView from './components/PublicCourseView';
import OrgDashboard from './components/OrgDashboard';
import LegalPages from './components/LegalPages';
import Footer from './components/Footer';
import TestTrustWrapping from './components/TestTrustWrapping';
import E2ETestRunner from './components/E2ETestRunner';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/topic" element={<TopicSelection />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/plan" element={<LearningPlan />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/create-course" element={<CourseCreator />} />
          <Route path="/course/:id/preview" element={<CoursePreview />} />
          <Route path="/course/:id/settings" element={<CourseSettings />} />
          <Route path="/c/:publicId" element={<PublicCourseView />} />
          <Route path="/org/dashboard" element={<OrgDashboard />} />
          <Route path="/test/trust-wrapping" element={<TestTrustWrapping />} />
          <Route path="/test/e2e" element={<E2ETestRunner />} />
          <Route path="/:page" element={<LegalPages />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Brain className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            Dhiva: Learn 1% Smarter Every Day
          </h1>
          <p className="mt-4 text-lg text-center text-gray-600">
            Bite-sized, personalized learning delivered via WhatsApp and Email.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a 
              href="#pricing"
              className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition"
            >
              Get Early Access
            </a>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="mt-16 px-4 md:px-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-lg bg-white shadow-sm">
            <strong className="block text-indigo-600 mb-2">1.</strong>
            Choose a topic
          </div>
          <div className="p-4 rounded-lg bg-white shadow-sm">
            <strong className="block text-indigo-600 mb-2">2.</strong>
            Dhiva builds your plan
          </div>
          <div className="p-4 rounded-lg bg-white shadow-sm">
            <strong className="block text-indigo-600 mb-2">3.</strong>
            Learn via WhatsApp or Email
          </div>
          <div className="p-4 rounded-lg bg-white shadow-sm">
            <strong className="block text-indigo-600 mb-2">4.</strong>
            Pause/resume anytime
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Dhiva</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-indigo-600" />}
              title="Choose Your Topic"
              description="Select from curated topics or upload your own content for personalized learning."
            />
            <FeatureCard
              icon={<Star className="h-8 w-8 text-indigo-600" />}
              title="Take a Quick Quiz"
              description="Assess your current knowledge level for tailored content delivery."
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8 text-indigo-600" />}
              title="Set Your Schedule"
              description="Choose when and how often you want to receive your microlearnings."
            />
            <FeatureCard
              icon={<BarChart className="h-8 w-8 text-indigo-600" />}
              title="Track Progress"
              description="Get weekly summaries and track your learning journey."
            />
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Learning Channel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <DeliveryCard
              icon={<Mail className="h-12 w-12 text-indigo-600" />}
              title="Email Delivery"
              description="Receive structured lessons directly in your inbox. Perfect for detailed learning and easy reference."
            />
            <DeliveryCard
              icon={<MessageSquare className="h-12 w-12 text-indigo-600" />}
              title="WhatsApp Delivery"
              description="Get bite-sized lessons on WhatsApp. Ideal for quick learning on the go."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="mt-16 px-4 md:px-12 max-w-4xl mx-auto pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold">Free Plan</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✅ 1 topic</li>
              <li>✅ Email only</li>
              <li>✅ Weekly summary</li>
              <li>❌ WhatsApp not included</li>
            </ul>
            <div className="mt-4 text-center font-bold">₹0/mo</div>
            <button
              onClick={() => navigate('/topic')}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Start Free
            </button>
          </div>
          <div className="border-2 border-indigo-600 p-6 rounded-xl shadow-md relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm">
              Popular
            </div>
            <h3 className="text-xl font-semibold">Dhiva Pro</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✅ Unlimited topics</li>
              <li>✅ WhatsApp + Email</li>
              <li>✅ Smart delivery</li>
              <li>✅ Weekly + daily recaps</li>
            </ul>
            <div className="mt-4 text-center font-bold">₹199/mo</div>
            <button
              onClick={() => navigate('/topic')}
              className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
            >
              Get Started
            </button>
          </div>
          <div className="border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold">Dhiva Creator</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✅ Upload your PDFs</li>
              <li>✅ Package & sell learnings</li>
              <li>✅ Full analytics</li>
              <li>✅ Brandable experience</li>
            </ul>
            <div className="mt-4 text-center font-bold">₹499/mo</div>
            <button
              onClick={() => navigate('/topic')}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Start Creating
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function DeliveryCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default App;