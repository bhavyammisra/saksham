import type { ComponentProps } from 'react'
import { sound } from '@/lib/sound'

const styles = {
  primary: 'bg-terracotta text-white hover:bg-terracotta-deep',
  secondary: 'border-2 border-sand bg-plaster text-ink hover:bg-marigold-soft',
}

/** The app's standard button: at least 48px tall, two looks, a soft tap sound. Takes a `ref` like a plain button. */
export function Button({
  look = 'primary',
  className = '',
  type = 'button',
  onClick,
  ...rest
}: ComponentProps<'button'> & { look?: keyof typeof styles }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-tap items-center justify-center rounded-button px-5 font-semibold ${styles[look]} ${className}`}
      onClick={(event) => {
        sound.play('tap')
        onClick?.(event)
      }}
      {...rest}
    />
  )
}
