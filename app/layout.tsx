import './globals.css';

export const metadata={title:'StoryX Video Studio',description:'AI long-form video generation studio'};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
