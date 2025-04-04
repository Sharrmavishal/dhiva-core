import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-6">
            <Brain className="h-8 w-8 text-indigo-600 mr-2" />
            <span className="text-xl font-semibold text-gray-900">Dhiva</span>
          </div>
          <nav className="flex space-x-6 mb-6">
            <Link to="/terms" className="text-gray-500 hover:text-gray-900">
              Terms of Use
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/ai-disclosure" className="text-gray-500 hover:text-gray-900">
              AI Disclosure
            </Link>
          </nav>
          <p className="text-gray-500">
            © 2025 Nataris.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;