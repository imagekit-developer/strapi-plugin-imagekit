import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'fill'> {
  /**
   * @default "currentColor"
   */
  fill?: string;
}

const ImageKitLogo = ({ fill = 'currentColor', ...props }: IconProps, ref: Ref<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 32 32"
      width={16}
      height={16}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={ref}
      fill={'#c0c0cf'}
    >
      <path
        d="M 14.673 7.738 C 14.165 7.201 13.904 6.476 13.953 5.738 C 13.971 5.027 14.256 4.348 14.753 3.838 C 15.27 3.333 15.97 3.059 16.693 3.078 C 17.4 3.062 18.079 3.354 18.553 3.878 C 19.081 4.354 19.386 5.028 19.393 5.738 C 19.419 6.496 19.112 7.227 18.553 7.738 C 18.03 8.234 17.333 8.503 16.613 8.488 C 15.892 8.511 15.192 8.24 14.673 7.738 Z M 22.403 21.338 C 19.703 28.678 9.473 30.658 11.403 21.138 L 13.603 10.338 L 18.283 10.338 C 17.213 16.088 16.413 19.588 15.623 23.588 C 14.833 27.588 19.903 24.658 21.053 21.328 L 22.403 21.328 L 22.403 21.338 Z"
        transform="matrix(1, 0, 0, 1, 1.1102230246251565e-16, 1.1102230246251565e-16)"
      />
    </svg>
  );
};

export default forwardRef(ImageKitLogo);
