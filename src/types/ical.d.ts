declare module "ical.js" {
  export function parse(input: string): any;

  export class Component {
    constructor(jCal: any, parent?: Component);
    getAllSubcomponents(name: string): Component[];
  }

  export class Event {
    constructor(component: Component);
    summary: string;
    uid: string;
    startDate: Time;
    endDate: Time;
  }

  export class Time {
    toJSDate(): Date;
  }
}
