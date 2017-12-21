import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as moment from 'moment';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';


class DlDateTimePickerChange {
  utc: number;

  constructor(milliseconds: number) {
    this.utc = milliseconds;
  }
}

@Component({
  selector: 'dl-date-time-picker',
  templateUrl: './dl-date-time-picker.component.html',
  styleUrls: ['./dl-date-time-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DlDateTimePickerComponent,
      multi: true
    }
  ]
})
export class DlDateTimePickerComponent implements OnInit, ControlValueAccessor {

  @Input()
  maxView: 'year' | 'month' | 'day' | 'hour' | 'minute';

  @Input()
  startView: 'year' | 'month' | 'day' | 'hour' | 'minute';

  @Input()
  minView: 'year' | 'month' | 'day' | 'hour' | 'minute';

  /** Emits when a `change` event is fired on this date/time picker. */
  @Output()
  change = new EventEmitter<DlDateTimePickerChange>();

  // @Input()
  leftIconClass = {
    'oi': true,
    'oi-chevron-left': true
  };

  // @Input()
  rightIconClass = {
    'oi': true,
    'oi-chevron-right': true
  };

  private _changed: ((value: number) => void)[] = [];
  private _model: DlDateTimePickerModel;
  private _touched: (() => void)[] = [];
  private _value: number;


  ngOnInit(): void {
    this._model = this.nextModel(new Date().getTime());
  }

  private nextModel(milliseconds: number): DlDateTimePickerModel {
    const rowNumbers = [0, 1, 2];
    const yearNumbers = [0, 1, 2, 3];

    const startYear = moment.utc(milliseconds).startOf('year');

    // View starts one year before the decade starts and ends one year after the decade ends
    // i.e. passing in a date of 1/1/2013 will give a range of 2009 to 2020
    // Truncate the last digit from the current year and subtract 1 to get the start of the decade
    const startDecade = (Math.trunc(startYear.year() / 10) * 10) - 1;

    const startDate = moment.utc(`${startDecade}-01-01`).startOf('year');

    const result: DlDateTimePickerModel = {
      view: 'year',
      leftButton: {
        value: moment.utc(startDate).subtract(9, 'years').valueOf(),
        classes: {},
        iconClasses: this.leftIconClass
      },
      rightButton: {
        value: moment.utc(startDate).add(11, 'years').valueOf(),
        classes: {},
        iconClasses: this.rightIconClass
      },
      rows: rowNumbers.map(rowOfYears)
    };

    result.leftButton.classes[`${result.leftButton.value}`] = true;
    result.rightButton.classes[`${result.rightButton.value}`] = true;

    return result;

    function rowOfYears(rowNumber) {

      // future and past years range is inclusive of start year decade.
      const futureYear = startDate.year() + 10;
      const pastYear = startDate.year() + 1;

      const currentMoment = moment.utc();
      const cells = yearNumbers.map((yearNumber) => {
        const yearMoment = moment.utc(startDate).add((rowNumber * yearNumbers.length) + yearNumber, 'years');
        return {
          'display': yearMoment.format('YYYY'),
          'value': yearMoment.valueOf(),
          'classes': {
            'current': yearMoment.isSame(currentMoment, 'year'),
            'future': yearMoment.year() > futureYear,
            'past': yearMoment.year() < pastYear,
          }
        };
      });
      return {cells};
    }
  }

  _onDateClick(milliseconds: number) {
    this.value = milliseconds;
  }

  _onLeftClick() {
    this._model = this.nextModel(this._model.leftButton.value);
  }

  _onRightClick() {
    this._model = this.nextModel(this._model.rightButton.value);
  }

  get value() {
    return this._value;
  }

  set value(value: number) {
    this._value = value;
    this._changed.forEach(f => f(value));
    this.change.emit(new DlDateTimePickerChange(value));
  }

  writeValue(value: number) {
    this.value = value;
  }

  registerOnChange(fn: (value: number) => void) {
    this._changed.push(fn);
  }

  registerOnTouched(fn: () => void) {
    this._touched.push(fn);
  }
}

interface DlDateTimePickerModel {
  view: string;
  leftButton: { value: number, classes: {}, iconClasses: {} };
  rightButton: { value: number, classes: {}, iconClasses: {} };
  rows: Array<{ cells: Array<{ display: string, value: number, classes: {} }> }>;
}
