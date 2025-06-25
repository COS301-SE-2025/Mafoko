declare module 'html2pdf.js' {
  function html2pdf(): html2pdf.Worker;

  namespace html2pdf {
    interface Worker {
      from(element: HTMLElement | string): Worker;
      set(options: WorkerOptions): Worker;
      save(): Promise<Worker>;
    }

    interface WorkerOptions {
      margin?: number | [number, number] | [number, number, number, number];
      filename?: string;
      image?: { type: string; quality: number };
      html2canvas?: object;
      jsPDF?: {
        unit?: string;
        format?: string;
        orientation?: 'portrait' | 'landscape';
      };
    }
  }

  export default html2pdf;
}
