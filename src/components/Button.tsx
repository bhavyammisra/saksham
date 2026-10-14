import type { ButtonHTMLAttributes } from 'react'

const styles = {
  primary: 'bg-terracotta text-white hover:bg-terracotta-deep',
  secondary: 'border-2 border-sand bg-plaster text-ink hover:bg-marigold-soft',
}

/** The app's standard button: at least 48px tall, two looks. */
export function Button({
  look = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { look?: keyof typeof styles }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-tap items-center justify-center rounded-button px-5 font-semibold ${styles[look]} ${className}`}
      {...rest}
    />
  )
}
