interface WordPressDate {
	date: ( dateFormat: string, dateValue: Date, timezone: string ) => string;
	dateI18n: (
		dateFormat: string,
		dateValue: Date,
		timezone: string
	) => string;
	format: ( dateFormat: string, dateValue: Date ) => string;
	getDate: ( dateString: string ) => Date;
	getSettings: () => {
		formats: {
			date: string;
			datetime: string;
			datetimeAbbreviated: string;
			time: string;
		};
		timezone: {
			string: string;
			offset: number;
			abbr: string;
			offsetFormatted: boolean;
		};
		l10n: {
			locale: string;
			meridiem: { am: string; pm: string; AM: string; PM: string };
			months: string[ 12 ];
			monthsShort: string[ 12 ];
			relative: {
				future: string;
				past: string;
				s: string;
				ss: string;
				m: string;
				mm: string;
				h: string;
				hh: string;
				d: string;
				dd: string;
				M: string;
				MM: string;
				y: string;
				yy: string;
			};
			weekdays: string[ 7 ];
			weekdaysShort: string[ 7 ];
		};
	};
	gmdate: ( dateFormat: string, dateValue: Date ) => string;
	gmdateI18n: ( dateFormat: string, dateValue: Date ) => string;
	humanTimeDiff: ( from: Date, to: Date ) => string;
	isInTheFuture: ( dateValue: Date ) => boolean;
	setSettings: ( dateSettings: {
		timezone: string;
		weekStart: number;
		timeFormat: string;
		dateFormat: string;
		timeZoneName: string;
	} ) => void;
}

export default WordPressDate;
