import { pageHeight, type Project } from '../model';
import Paper from './Paper';
export default function PrintView({ project, urls }: {
    project: Project;
    urls: Record<string, string>;
}) {
    const zoom = project.widthMm * 96 / 25.4 / 1000;
    return <><style>{'@page { size: ' + project.widthMm + 'mm ' + project.heightMm + 'mm; margin: 0; }'}</style><div className="print-root" aria-hidden="true">{project.pages.map(page => <section className="print-page" key={page.id} style={{ width: project.widthMm + 'mm', height: project.heightMm + 'mm' }}><div className="print-scale" style={{ zoom, width: 1000, height: pageHeight(project) }}><Paper project={project} page={page} urls={urls}/></div></section>)}</div></>;
}
