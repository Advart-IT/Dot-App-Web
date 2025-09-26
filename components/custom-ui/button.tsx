"use client";

import React from "react";

type ButtonVariant = "primary" | "outline" | "danger"  | "secondary" | "gray" | "text" | "link" | "icon";
type ButtonSize = "s" | "m" | "l" | "none";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string; // Existing className for additional styles
}

const baseStyles =
  "rounded-x5 flex items-center justify-center font-normal disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200";

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-newprimary text-newsecondary hover:bg-newprimary/70",
    danger: "bg-dng text-themeBase hover:bg-dng/70 ",
    outline: "border border-themeBase-l2 bg-themeBase text-dtxt-d hover:border-newsecondary ",
    secondary: "bg-newsecondary text-themeBase hover:bg-newsecondary/70",
    icon: "bg-transparent p-x5 hover:bg-themeBase-l2",
    gray: "bg-themeBase-l1 text-dtxt-d hover:bg-themeBase-l1/70",
    text: "hover:bg-lbl text-dtxt-d",
    link: "text-link hover:underline",
};

const sizeStyles: Record<ButtonSize, string> = {
  s: "px-x15 py-x5 text-12",
  m: "px-x15 py-x5 text-14",
  l: "px-x15 py-x5 text-16",
  none:"p-0 text-14", // No padding, just text size
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "m",
  className = "",
  children,
  ...props
}) => {
  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};