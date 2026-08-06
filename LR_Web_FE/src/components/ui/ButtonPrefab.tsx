import { useState } from "react";

const DARK = "#1f2937";
const WHITE = "#ffffff";

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
};

export const LightButton = ({ children, onClick, isBig, isCentered, isRight }: ButtonProps & { isBig?: boolean; isCentered?: boolean; isRight?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: isHovered ? DARK : WHITE,
                color: isHovered ? WHITE : DARK,
                border: `1px solid ${DARK}`,
                transition: "background-color 200ms ease, color 200ms ease",
                ...(isCentered
                    ? {
                          position: "fixed",
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 9999,
                      }
                    : {}),
                ...(isRight
                    ? {
                          position: "fixed",
                          right: "20px",
                          zIndex: 9999,
                      }
                    : {}),
            }}
            className={`inline-block rounded-lg px-4 py-2 text-sm font-semibold ${isBig ? 'w-1/3 h-16 text-xl' : ''}`}
        >
            {children}
        </button>
    );
};

export const DarkButton = ({ children, onClick, isBig, isMedium,isCentered, isRight, isFlexible }: ButtonProps & { isBig?: boolean; isMedium?: boolean; isCentered?: boolean; isRight?: boolean; isFlexible?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: isHovered ? WHITE : DARK,
                color: isHovered ? DARK : WHITE,
                border: `1px solid ${DARK}`,
                transition: "background-color 200ms ease, color 200ms ease",
                ...(isCentered
                    ? {
                          position: "fixed",
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 9999,
                      }
                    : {}),
                ...(isRight
                    ? {
                          position: "fixed",
                          right: "17%",

                          zIndex: 9999,
                      }
                    : {}),
                    ...(isFlexible
                    ? {
                          width: "100%",
                          height: "3rem",
                          fontSize: "1.125rem",
                      }
                    : {}),
            }}
            className={`inline-block rounded-lg px-4 py-2 text-sm font-semibold ${isBig ? 'w-1/3 h-16 text-xl' : isMedium ? 'w-1/5 h-14 text-xl' : isFlexible ? 'w-full h-12 text-lg' : ''}`}
        >
            {children}
        </button>
    );
};