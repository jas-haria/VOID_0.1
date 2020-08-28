export class ChartDetails {
    title: string;
    name: string;
    monthSelected: boolean;
    barSelected: boolean;
    chart: any;
    data: number[];

    constructor(title: string, name: string) {
        this.title = title;
        this.name = name;
        this.monthSelected = false;
        this.barSelected = false;
        this.chart = null;
        this.data = [];
    }
}