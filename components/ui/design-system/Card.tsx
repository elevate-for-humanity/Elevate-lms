'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * CARD COMPONENT - 10/10
 *
 * One Card component with consistent rules.
 * No custom cards on pages.
 *
 * Rules:
 * - Radius: rounded-card (16px)
 * - Border: subtle and consistent
 * - Shadow: consistent (or none)
 * - Padding: p-6 (desktop), p-4 (mobile)
 */

const variantClasses = {
  default: 'bg-white border border-slate-200',
  bordered: 'bg-white border-2 border-slate-300',
  elevated: 'bg-white shadow-card hover:shadow-card-hover',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'bordered' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
  }
>(({ className, variant = 'default', padding = 'md', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card transition-all duration-200",
      variantClasses[variant],
      paddingClasses[padding],
      props.onClick && 'cursor-pointer hover:border-brand-blue-600',
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
