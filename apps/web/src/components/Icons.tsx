import type { SVGProps } from 'react'

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true } as const

export const IconCart = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20.5" r="1.4" /><circle cx="17" cy="20.5" r="1.4" /></svg>)
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (<svg {...base} strokeWidth={3} {...p}><path d="M12 5v14M5 12h14" /></svg>)
export const IconHome = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>)
export const IconGrid = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>)
export const IconGame = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><rect x="2.5" y="7" width="19" height="11" rx="5.5" /><path d="M7.5 10.5v4M5.5 12.5h4" /><circle cx="15.5" cy="11.5" r="1" fill="currentColor" /><circle cx="18" cy="13.5" r="1" fill="currentColor" /></svg>)
export const IconChat = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 10h8M8 13h5" /></svg>)
export const IconSoundOn = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>)
export const IconSoundOff = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 9l4 6M21 9l-4 6" /></svg>)
export const IconPhone = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>)
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (<svg {...base} strokeWidth={3} {...p}><path d="m5 12 5 5L20 7" /></svg>)
export const IconLock = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><rect x="3" y="10" width="18" height="11" rx="3" /><path d="M7 10V7a5 5 0 0 1 10 0v3" /></svg>)
export const IconTruck = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>)
export const IconSparkle = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>)
export const IconCamera = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>)
export const IconMoon = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>)
export const IconSunSmall = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></svg>)
export const IconX = (p: SVGProps<SVGSVGElement>) => (<svg {...base} strokeWidth={3} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>)
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>)
export const IconGift = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12M12 9c-2-4-7-4-6-1s6 1 6 1zm0 0c2-4 7-4 6-1s-6 1-6 1z" /></svg>)
export const IconKey = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><circle cx="8" cy="14" r="4.5" /><path d="M11.3 10.8 20 2M17 5l2.5 2.5M14.5 7.5 17 10" /></svg>)
