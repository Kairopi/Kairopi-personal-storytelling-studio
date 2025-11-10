
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, ...props }) => {
  const baseClasses = "px-6 py-3 rounded-full font-medium text-sm tracking-wide transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ethereal-cream flex items-center justify-center space-x-2";
  
  const variantClasses = {
    primary: 'bg-kairo-gold text-white shadow-subtle hover:bg-kairo-gold-dark',
    secondary: 'bg-charcoal-ink/5 text-charcoal-ink hover:bg-charcoal-ink/10 ring-1 ring-inset ring-charcoal-ink/10',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};

export default Button;
