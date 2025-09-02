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

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.5 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.footer
      className="bg-transparent text-gray-600 mt-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
      variants={containerVariants}
    >
      <div className="container mx-auto px-4 py-4">
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Brand */}
          <motion.div className="flex flex-col md:col-span-1 mb-2 md:mb-0" variants={itemVariants}>
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
          </motion.div>

          {/* Quick Links */}
          <motion.div className="flex flex-col md:justify-start mb-2 md:mb-0" variants={itemVariants}>
            <h4 className="font-semibold text-gray-900 text-xs mb-1">Quick Links</h4>
            <ul className="space-y-1">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    variants={linkVariants}
                    whileHover="hover"
                    className="hover:text-gray-900 text-xs transition-colors cursor-pointer"
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social Media */}
          <motion.div className="flex flex-col md:justify-start" variants={itemVariants}>
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
                  className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  <social.icon size={16} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Soft black divider */}
        <motion.div className="mt-4 border-t border-black/20" variants={itemVariants}></motion.div>

        {/* Bottom */}
        <motion.div className="mt-2 text-center text-xs text-gray-900" variants={itemVariants}>
          <p>&copy; {new Date().getFullYear()} SSI STUDIOS. All rights reserved.</p>
          <p className="mt-1 font-medium">Developed By SSIMAYA</p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
