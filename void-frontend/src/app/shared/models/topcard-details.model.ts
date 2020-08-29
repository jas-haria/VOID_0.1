export class TopCardDetails {
    title: string
    middleValue: string
    bottomValue: string
    bottomValueSuccess: boolean
    icon: string
    iconBgColor: string

    constructor(title: string, icon: string, iconBgColor: string) {
        this.title = title;
        this.icon = icon;
        this.iconBgColor = iconBgColor;
        this.bottomValue = '';
        this.bottomValueSuccess = false;
    }
}