'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

const imageButtonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center overflow-hidden p-0',
    'border-0 bg-transparent',
    'transition-opacity hover:opacity-90',
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'focus-visible:ring-ring focus-visible:ring-offset-surface',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      block: {
        true: 'w-full',
        false: '',
      },
      fit: {
        contain: '[&_[data-slot=image-button-image]]:object-contain',
        cover: '[&_[data-slot=image-button-image]]:object-cover',
        fill: '[&_[data-slot=image-button-image]]:h-full [&_[data-slot=image-button-image]]:w-full',
      },
    },
    defaultVariants: {
      block: true,
      fit: 'fill',
    },
  },
)

type ImageButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  VariantProps<typeof imageButtonVariants> & {
    src: string
    alt: string
    imageClassName?: string
  }

const ImageButton = forwardRef<HTMLButtonElement, ImageButtonProps>(
  (
    { className, block, fit, src, alt, imageClassName, type = 'button', disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        data-slot="image-button-root"
        className={cn(imageButtonVariants({ block, fit }), className)}
        disabled={disabled}
        aria-label={props['aria-label'] ?? alt}
        {...props}
      >
        <img
          data-slot="image-button-image"
          src={src}
          alt={alt}
          className={cn('block max-w-full select-none', imageClassName)}
          draggable={false}
        />
      </button>
    )
  },
)

ImageButton.displayName = 'ImageButton'

export { ImageButton, imageButtonVariants }
export type { ImageButtonProps }
