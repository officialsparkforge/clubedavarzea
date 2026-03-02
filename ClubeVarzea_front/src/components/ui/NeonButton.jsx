import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * NeonButton - A button component with neon styling
 * Extends the base button with bright green neon effects and animations
 */
const NeonButton = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        'relative bg-[#00FF85] text-black hover:bg-[#00FF85]/90',
        'font-semibold shadow-lg hover:shadow-xl transition-all duration-200',
        'hover:shadow-[0_0_20px_rgba(0,255,133,0.5)]',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
);

NeonButton.displayName = 'NeonButton';

export default NeonButton;
