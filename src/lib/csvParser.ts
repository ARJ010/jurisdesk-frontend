export interface ParsedCSVRow {
  name: string;
  mobile_number: string;
  enrolment_no: string;
  kawf_no: string;
  date_of_birth: string;
  blood_group: string;
  date_of_enrolment: string;
  joined_date: string;
  address: string;
  email: string;
  initial_dues?: string;
}

export const parseCSV = (text: string): ParsedCSVRow[] => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || !lines[0].trim()) return [];

  // Parse headers, strip wrapping quotes
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const rows: ParsedCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split line values, handling quotes to support addresses with commas
    const values: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));

    // Map headers to row object
    const row: any = {};
    headers.forEach((header, idx) => {
      const val = values[idx] || '';
      // Map legacy/common csv column headers to standard fields
      if (header === 'name' || header === 'fullname') row.name = val;
      else if (header === 'mobile' || header === 'mobile_number') row.mobile_number = val;
      else if (header === 'enrolment_no' || header === 'enrolment_number' || header === 'roll_no') row.enrolment_no = val;
      else if (header === 'kawf_no' || header === 'kawf_number') row.kawf_no = val;
      else if (header === 'date_of_birth' || header === 'dob') row.date_of_birth = val;
      else if (header === 'blood_group' || header === 'blood') row.blood_group = val;
      else if (header === 'date_of_enrolment' || header === 'enrolment_date') row.date_of_enrolment = val;
      else if (header === 'joined_date' || header === 'admission_date') row.joined_date = val;
      else if (header === 'address') row.address = val;
      else if (header === 'email') row.email = val;
      else if (header === 'initial_dues' || header === 'dues' || header === 'balance') row.initial_dues = val;
    });

    if (row.name || row.enrolment_no || row.mobile_number) {
      rows.push(row as ParsedCSVRow);
    }
  }

  return rows;
};

// Generate a dummy template for downloads
export const generateCSVTemplate = (): string => {
  const headers = [
    'Name',
    'Mobile_Number',
    'Enrolment_No',
    'KAWF_No',
    'Date_Of_Birth',
    'Blood_Group',
    'Date_Of_Enrolment',
    'Joined_Date',
    'Address',
    'Email',
    'Initial_Dues',
  ];
  const row1 = [
    'Adv. Rajesh Kumar',
    '9846201122',
    'K/123/2021',
    'KAWF-10924',
    '1992-04-12',
    'A+',
    '2021-03-10',
    '2024-05-15',
    'Harshavardhana Villa, Kanhangad',
    'rajesh@example.com',
    '0.00',
  ];
  return [headers.join(','), row1.join(',')].join('\n');
};
