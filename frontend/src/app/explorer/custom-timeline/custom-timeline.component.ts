import {
  Component, Input, Output, EventEmitter, ElementRef,
  OnChanges, ChangeDetectionStrategy,
  ChangeDetectorRef, SimpleChanges, ViewEncapsulation
} from '@angular/core';
import { brushX } from "d3-brush";
import { scaleLinear, scaleTime, scalePoint } from 'd3-scale';
import { select, event as d3event } from "d3-selection";

import { id } from "@swimlane/ngx-charts/release/utils";

@Component({
  selector: 'g[app-custom-timeline]',
  templateUrl: './custom-timeline.component.html',
  styleUrls: ['./custom-timeline.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomTimelineComponent implements OnChanges {

  @Input() view;
  @Input() state;
  @Input() results;
  @Input() scheme;
  @Input() customColors;
  @Input() legend;
  @Input() miniChart;
  @Input() autoScale;
  @Input() scaleType;
  @Input() height: number = 50;
  @Input() xScaleMax;
  @Output() select = new EventEmitter();
  @Output() onDomainChange = new EventEmitter();

  element: HTMLElement;
  dims: any;
  xDomain: any[];
  xScale: any;
  brush: any;
  transform: string;
  initialized: boolean = false;
  filterId: any;
  filter: any;

  constructor(
    element: ElementRef,
    private cd: ChangeDetectorRef) {
    this.element = element.nativeElement;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();

    if (!this.initialized) {
      this.addBrush();
      this.initialized = true;
    }
  }

  update(): void {
    this.dims = this.getDims();
    this.height = this.dims.height;
    const offsetY = this.view[1] - this.height;

    this.xDomain = this.getXDomain();
    this.xScale = this.getXScale();

    if (this.brush) {
      this.updateBrush();
    }

    this.transform = `translate(0 , ${ offsetY })`;

    this.filterId = 'filter' + id().toString();
    this.filter = `url(#${this.filterId})`;

    this.cd.markForCheck();
  }

  getXDomain(): any[] {
    let values = [];

    for (const results of this.results) {
      for (const d of results.series) {
        if (!values.includes(d.name)) {
          values.push(d.name);
        }
      }
    }

    let domain = [];
    if (this.scaleType === 'time') {
      const min = Math.min(...values);
      const max = (this.xScaleMax) ? this.xScaleMax : Math.max(...values);
      domain = [min, max];
    } else if (this.scaleType === 'linear') {
      values = values.map(v => Number(v));
      const min = Math.min(...values);
      const max = (this.xScaleMax) ? this.xScaleMax : Math.max(...values);
      domain = [min, max];
    } else {
      domain = values;
    }

    return domain;
  }

  getXScale() {
    let scale;

    if (this.scaleType === 'time') {
      scale = scaleTime()
        .range([0, this.dims.width])
        .domain(this.xDomain);
    } else if (this.scaleType === 'linear') {
      scale = scaleLinear()
        .range([0, this.dims.width])
        .domain(this.xDomain);
    } else if (this.scaleType === 'ordinal') {
      scale = scalePoint()
        .range([0, this.dims.width])
        .padding(0.1)
        .domain(this.xDomain);
    }

    return scale;
  }

  addBrush(): void {
    if (this.brush) return;

    const height = this.height;
    const width = this.view[0];

    this.brush = brushX()
      .extent([[0, 0], [width, height]])
      .on('brush end', () => {
        const selection = d3event.selection || this.xScale.range();
        const newDomain = selection.map(this.xScale.invert);
        //console.log(selection);

        this.onDomainChange.emit(newDomain);
        this.cd.markForCheck();
      });

    select(this.element)
      .select('.brush')
      .call(this.brush);
  }

  updateBrush(): void {
    if (!this.brush) return;

    const height = this.height;
    const width = this.view[0];

    this.brush.extent([[0, 0], [width, height]]);
    select(this.element)
      .select('.brush')
      .call(this.brush);

    // clear hardcoded properties so they can be defined by CSS
    select(this.element).select('.selection')
      .attr('fill', undefined)
      .attr('stroke', undefined)
      .attr('fill-opacity', undefined);

    this.cd.markForCheck();
  }

  updateBrushProgrammatically(dom): void {
    select(this.element)
      .select('.brush').call(this.brush.move, dom);
  }

  getDims(): any {
    const width = this.view[0];

    const dims = {
      width,
      height: this.height
    };

    return dims;
  }

}
