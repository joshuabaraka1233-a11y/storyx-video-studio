export type Project = {
  id: string;
  title: string;
  description: string;
  duration: number;
  style: string;
  status: 'Draft' | 'Rendering' | 'Complete';
  created: string;
  progress: number;
};
