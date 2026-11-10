/** Text the date pickers show or announce. Pass any subset as `labels` to translate. */
export interface DatePickerLabels {
  /** Supporting text above the headline (modal) */
  selectDate: string
  selectDates: string
  enterDate: string
  /** Headline before a date is chosen (modal) */
  noDate: string
  /** Field labels in input mode */
  date: string
  startDate: string
  endDate: string
  /** Error under a typed date; {pattern} is the expected format, e.g. "mm/dd/yyyy" */
  invalidDate: string
  switchToCalendar: string
  switchToInput: string
  /** Docked: the button that opens the calendar */
  openCalendar: string
  previousMonth: string
  nextMonth: string
  confirm: string
  cancel: string
}

export const datePickerLabels: DatePickerLabels = {
  selectDate: 'Select date',
  selectDates: 'Select dates',
  enterDate: 'Enter date',
  noDate: 'Selected date',
  date: 'Date',
  startDate: 'Start date',
  endDate: 'End date',
  invalidDate: 'Use {pattern}',
  switchToCalendar: 'Switch to calendar',
  switchToInput: 'Switch to text input',
  openCalendar: 'Choose date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  confirm: 'OK',
  cancel: 'Cancel',
}
