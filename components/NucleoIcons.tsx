import React from 'react';
import Svg, { Path, G, Line, Rect, Circle } from 'react-native-svg';

interface IconProps {
    color?: string;
    size?: number;
}

export const HomeIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M3 10.182V20a1 1 0 001 1h5a1 1 0 001-1v-5a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 001 1h5a1 1 0 001-1v-9.818a1 1 0 00-.293-.707L12.707 3.293a1 1 0 00-1.414 0L3.293 9.475A1 1 0 003 10.182z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export const PlusIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 5v14M5 12h14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export const FolderIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export const MagicWandIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M3 21l10-10M19 9l2 2-2 2m-4-8l2-2 2 2m-10-2L5 3 3 5m12 0l1 1m2 7l1 1"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M15 4l1 1m1 7l1 1m-5-8l1 1M8 3L7 4M4 7L3 8"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </Svg>
);

export const XmarkIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G fill={color}>
            <Line fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" x1="14" x2="4" y1="4" y2="14" />
            <Line fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" x1="4" x2="14" y1="4" y2="14" />
        </G>
    </Svg>
);

export const TrashIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G fill={color}>
            <Path d="M13.6977 7.75L13.35 14.35C13.294 15.4201 12.416 16.25 11.353 16.25H6.64804C5.58404 16.25 4.70703 15.42 4.65103 14.35L4.30334 7.75" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <Path d="M2.75 4.75H15.25" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <Path d="M6.75 4.75V2.75C6.75 2.2 7.198 1.75 7.75 1.75H10.25C10.802 1.75 11.25 2.2 11.25 2.75V4.75" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </G>
    </Svg>
);

export const FolderNewIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G fill={color}>
            <Path d="M2.25,8.75V4.75c0-1.105,.895-2,2-2h1.951c.607,0,1.18,.275,1.56,.748l.603,.752h5.386c1.105,0,2,.895,2,2v2.844" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <Path d="M4.25,6.75H13.75c1.105,0,2,.895,2,2v4.5c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2v-4.5c0-1.105,.895-2,2-2Z" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </G>
    </Svg>
);

export const PenSparkleIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G fill={color}>
            <Path d="M2.75,15.25s3.599-.568,4.546-1.515c.947-.947,7.327-7.327,7.327-7.327,.837-.837,.837-2.194,0-3.03-.837-.837-2.194-.837-3.03,0,0,0-6.38,6.38-7.327,7.327s-1.515,4.546-1.515,4.546h0Z" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <Path d="M5.493,3.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z" fill={color} stroke="none" />
            <Path d="M16.658,12.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z" fill={color} stroke="none" />
            <Circle cx="7.75" cy="1.75" fill={color} r=".75" stroke="none" />
        </G>
    </Svg>
);

export const House2Icon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G fill={color}>
            <Path d="M9 16V12.75" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <Path d="M3.145 5.95L8.395 1.96C8.753 1.688 9.248 1.688 9.605 1.96L14.855 5.95C15.104 6.139 15.25 6.434 15.25 6.746V14.25C15.25 15.355 14.355 16.25 13.25 16.25H4.75C3.645 16.25 2.75 15.355 2.75 14.25V6.746C2.75 6.433 2.896 6.139 3.145 5.95Z" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </G>
    </Svg>
);

export const MicrophoneIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G fill={color}>
            <Rect height="9.5" width="6.5" fill="none" rx="3.25" ry="3.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" x="5.75" y="1.75" />
            <Path d="M15.25,8c0,3.452-2.798,6.25-6.25,6.25h0c-3.452,0-6.25-2.798-6.25-6.25" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            <Line fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" x1="9" x2="9" y1="14.25" y2="16.25" />
        </G>
    </Svg>
);

export const MicrophoneSlashIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G fill={color}>
            <Path d="M4.583 13.417L5.649 12.351C4.345 11.345 3.5 9.771 3.5 8C3.5 7.586 3.164 7.25 2.75 7.25C2.336 7.25 2 7.586 2 8C2 10.185 3.01 12.133 4.583 13.417Z" fill={color} />
            <Path d="M6.721 11.279L13 5C13 2.794 11.206 1 9 1C6.794 1 5 2.794 5 5V8C5 9.358 5.683 10.556 6.721 11.279Z" fill={color} />
            <Path d="M1.99999 16.75C1.80799 16.75 1.61599 16.677 1.46999 16.53C1.17699 16.237 1.17699 15.762 1.46999 15.469L15.47 1.46999C15.763 1.17699 16.238 1.17699 16.531 1.46999C16.824 1.76299 16.824 2.23799 16.531 2.53099L2.52999 16.53C2.38399 16.676 2.19199 16.75 1.99999 16.75Z" fill={color} />
            <Path d="M15.9998 8C15.9998 7.58579 15.664 7.25 15.2498 7.25C14.8356 7.25 14.4998 7.58579 14.4998 8C14.4998 11.0378 12.0376 13.5 8.99979 13.5C8.71828 13.5 8.44255 13.479 8.17363 13.4385C7.76403 13.3769 7.38203 13.659 7.32041 14.0686C7.2588 14.4782 7.5409 14.8602 7.9505 14.9219C8.04964 14.9368 8.14941 14.9496 8.24979 14.9603V16.25C8.24979 16.6642 8.58557 17 8.99979 17C9.414 17 9.74979 16.6642 9.74979 16.25V14.9603C13.2633 14.5861 15.9998 11.6128 15.9998 8Z" fill={color} />
        </G>
    </Svg>
);
