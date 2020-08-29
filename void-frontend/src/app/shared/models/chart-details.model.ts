export class ChartDetails {
    title: string;
    name: string;
    monthSelected: boolean;
    barSelected: boolean;
    chart: any;
    data: any[];
    multipleDatasets: boolean;
    multipleTitles: string[]

    constructor(title: string, name: string, multipleDatasets: boolean) {
        this.title = title;
        this.name = name;
        this.monthSelected = false;
        this.barSelected = false;
        this.chart = null;
        this.data = [];
        this.multipleDatasets = multipleDatasets;
        this.multipleTitles = [];
    }
}