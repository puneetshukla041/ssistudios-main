'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Twitter, Linkedin, Globe } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    { label: 'Instagram', icon: Instagram, href: '#' },
    { label: 'Facebook', icon: Facebook, href: '#' },
    { label: 'Twitter', icon: Twitter, href: '#' },
    { label: 'LinkedIn', icon: Linkedin, href: '#' },
  ];

  const footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Contact Us', href: '#' },
  ];

  const iconVariants = { hover: { scale: 1.2, rotate: 5, color: '#000' }, tap: { scale: 0.9 } };
  const linkVariants = { hover: { color: '#000' } };

  return (
    <footer className="bg-transparent text-gray-600 mt-4 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

          {/* Brand */}
          <div className="flex flex-col md:col-span-1 mb-2 md:mb-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">SSI STUDIOS</h3>
            <p className="text-xs leading-snug mb-1">
              Empowering creativity with innovative design tools.
            </p>
            <a
              href="https://www.ssinnovations.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Globe size={14} />
              <span className="font-medium">ssinnovations.com</span>
            </a>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col md:justify-start mb-2 md:mb-0">
            <h4 className="font-semibold text-gray-900 text-xs mb-1">Quick Links</h4>
            <ul className="space-y-1">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    variants={linkVariants}
                    whileHover="hover"
                    className="hover:text-gray-900 text-xs transition-colors"
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div className="flex flex-col md:justify-start">
            <h4 className="font-semibold text-gray-900 text-xs mb-1">Follow Us</h4>
            <div className="flex space-x-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  variants={iconVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <social.icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Soft black divider */}
        <div className="mt-4 border-t border-black/20"></div>

        {/* Bottom */}
        <div className="mt-2 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} SSI STUDIOS. All rights reserved.</p>
          <p className="mt-1 md:mt-0">Developed By <span className="font-medium">SSIMAYA</span></p>
        </div>
      </div>
    </footer>
  );
}
