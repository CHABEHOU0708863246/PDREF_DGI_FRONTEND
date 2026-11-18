import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';

@Component({
  selector: 'pdref-aide-circuit-page',
  standalone: true,
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header title="Circuit du dossier" subtitle="Les etapes de traitement dans PDREF." />
    <section class="pd-card">
      <ol class="pd-timeline">
        <li><strong>1. Depot</strong> : le contribuable depose sa demande et ses pieces.</li>
        <li><strong>2. Verification GUDEF</strong> : un agent verifie le dossier et ouvre les avis.</li>
        <li><strong>3. Avis DERAR, DVFN et rattachement</strong> : chaque direction rend un avis.</li>
        <li><strong>4. Validation globale</strong> : la GUDEF decide et genere le courrier.</li>
        <li><strong>5. Signature et depot</strong> : le courrier est signe, puis depose.</li>
        <li><strong>6. Autorisation de rectification</strong> : le CTF autorise, le contribuable depose le dossier rectifie.</li>
        <li><strong>7. Controle CTF</strong> : conforme vers la GUDEF, non conforme avec motif et nouveau depot.</li>
      </ol>
    </section>
  `,
})
export class AideCircuitPageComponent {}
