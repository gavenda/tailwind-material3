/** Text the time picker shows or announces. Pass any subset as `labels` to translate. */
export interface TimePickerLabels {
  /** Title above the time */
  selectTime: string
  enterTime: string
  hour: string
  minute: string
  /** Spoken dial value in minute mode; {minutes} is the number */
  minutes: string
  /** Name of the AM/PM group (the AM and PM text itself follows `locale`) */
  period: string
  switchToClock: string
  switchToInput: string
  confirm: string
  cancel: string
}

export const timePickerLabels: TimePickerLabels = {
  selectTime: 'Select time',
  enterTime: 'Enter time',
  hour: 'Hour',
  minute: 'Minute',
  minutes: '{minutes} minutes',
  period: 'AM or PM',
  switchToClock: 'Switch to clock',
  switchToInput: 'Switch to text input',
  confirm: 'OK',
  cancel: 'Cancel',
}
