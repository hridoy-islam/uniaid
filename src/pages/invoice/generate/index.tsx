import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';
import moment from 'moment';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    marginTop: -40
  },
  logoContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingVertical: 5
  },
  logo: {
    width: '100px',
    height: '100px',
    objectFit: 'contain'
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'semibold',
    color: '#00a185'
  },
  value: {
    fontSize: 10,
    fontWeight: 'normal',
    marginBottom: 3
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  invoiceFromTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  fromSection: {
    width: '45%'
  },
  toSection: {
    width: '45%'
  },
  label: {
    fontSize: 12,
    fontWeight: 'Bold',
    paddingBottom: 2
  },
  table: {
    display: 'table',
    width: '100%',
    marginTop: 10
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00a185'
  },
  tableHeaderCell: {
    padding: 5,
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    borderRightWidth: 2,
    borderRightColor: '#fff'
  },
  tableHeaderAmountCell: {
    padding: 5,
    fontSize: 10,
    color: 'white',
    textAlign: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tableCell: {
    padding: 5,
    paddingRight: 10,
    fontSize: 10,
    fontWeight: 'normal',
    textAlign: 'center',
    borderRightColor: '#fff',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  totalDetails: {
    width: '50%'
  },
  totalCalculations: {
    width: '40%'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'normal',
    textAlign: 'right',
    width: '60%'
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'normal',
    textAlign: 'right',
    width: '40%'
  },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#00a185',
    padding: 5,
    marginTop: 5
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'semibold',
    color: 'white',
    textAlign: 'right',
    width: '60%'
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 'semibold',
    color: 'white',
    textAlign: 'right',
    width: '40%'
  },
  discountMessage: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 10,
    color: '#555'
  },
  grayText: {
    color: '#888'
  },
  grayBackground: {
    backgroundColor: '#f3f3f3'
  }
});

interface CreatedBy {
  name: string;
  email: string;
  location: string;
  imgUrl: string;
  accountNo?: string;
  sortCode?: string;
  beneficiary?: string;
}

interface Customer {
  name: string;
  email: string;
  address: string;
  logo?: string;
  sortCode?: string;
  accountNo?: string;
  beneficiary?: string;
}

interface Bank {
  name: string;
  sortCode: string;
  accountNo: string;
  beneficiary?: string;
}

interface Student {
  refId: string;
  collegeRoll: string;
  firstName: string;
  lastName: string;
  course: string;
  amount: number;
}

interface Invoice {
  createdBy: CreatedBy;
  customer: Customer;
  bank: Bank;
  reference: string;
  date: Date;
  semester: string;
  noOfStudents: number;
  students: Student[];

  discountType?: string;
  discountAmount?: number;
  discountMsg?: string;
  vat?: number;
  totalAmount: number;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyVatNo?: string;
  companyCountry?: string;
  companyCity?: string;
  companyPostalCode?: string;
  companyState?: string;
  createdAt?: Date;
}

const InvoicePDF = ({ invoice = {} as Invoice }) => {
  const {
    createdBy = {} as CreatedBy,
    customer = {} as Customer,
    bank = {} as Bank,
    reference = '',
    date = undefined,
    semester = '',
    noOfStudents = 0,
    students = [],

    discountType = 'flat',
    discountAmount = 0,
    discountMsg = '',
    vat = 0,
    companyName = '',
    companyAddress = '',
    companyEmail = '',
    companyVatNo = '',
    companyCountry = '',
    companyCity = '',
    companyPostalCode = '',
    companyState = '',
    createdAt= undefined,
    // totalAmount = 0,
  } = invoice;

  // Calculate subtotal
  const subtotal = students.reduce((acc, student) => acc + student.amount, 0);

  // Calculate discount value
  const discountValue =
    discountType === 'percentage'
      ? subtotal * (discountAmount / 100)
      : discountAmount;

  // Calculate VAT amount
  const vatBase = subtotal - discountValue;
  const vatAmount = subtotal * (vat / 100);

  const totalAmount = vatBase + vatAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={createdBy?.imgUrl} style={styles.logo} />
          </View>
        </View>

        <View style={styles.invoiceFromTo}>
          <View style={styles.fromSection}>
            <Text style={styles.sectionTitle}>INVOICE FROM</Text>

            {/* Name */}
            <Text style={styles.label}>{companyName}</Text>

            {/* Email */}
            {companyEmail ? (
              <Text style={styles.value}>Email: {companyEmail}</Text>
            ) : null}

            {/* Address */}
            {companyAddress ? (
              <Text style={styles.value}>Address: {companyAddress}</Text>
            ) : null}

            {/* City & Postal Code (Combined to prevent empty lines) */}
            {companyCity || companyState || companyPostalCode ? (
              <Text style={styles.value}>
                {[companyCity, companyState, companyPostalCode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            ) : null}

            {/* Country */}
            {companyCountry ? (
              <Text style={styles.value}>{companyCountry}</Text>
            ) : null}

            {/* VAT Number (New Field) */}
            {companyVatNo ? (
              <Text style={styles.value}>VAT reg no: {companyVatNo}</Text>
            ) : null}
          </View>

          <View style={{ marginRight: 60 }}>
            <Text style={styles.sectionTitle}>INVOICE DETAILS</Text>
            <Text style={styles.value}>Semester: {semester}</Text>
            <Text style={styles.value}>No of Students: {noOfStudents}</Text>
            <Text style={styles.value}>
              Date: {moment(createdAt).format('Do MMM, YYYY')}
            </Text>
            <Text style={styles.value}>Reference: {reference}</Text>
          </View>
        </View>

        <View style={styles.twoColumnContainer}>
          <View style={styles.toSection}>
            <Text style={styles.sectionTitle}>INVOICE TO</Text>
            <Text style={styles.label}>{customer.name}</Text>
            <Text style={styles.value}>Email: {customer.email}</Text>
            <Text style={styles.value}>Address: {customer.address}</Text>
          </View>

          <View style={{ marginRight: 35 }}>
            <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
            <Text style={styles.value}>Sort Code: {bank.sortCode}</Text>
            <Text style={styles.value}>Account No: {bank.accountNo}</Text>
            <Text style={styles.value}>Beneficiary: {bank.beneficiary}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '5%' }]}>SL</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>
              REFERENCE
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '50%', textAlign: 'left' }
              ]}
            >
              NAME
            </Text>
            <Text style={[styles.tableHeaderAmountCell, { width: '20%' }]}>
              AMOUNT
            </Text>
          </View>

          {students.map((student, index) => {
            const rowStyle = index % 2 !== 0 ? styles.grayBackground : {};
            return (
              <View style={[styles.tableRow, rowStyle]} key={index}>
                <Text style={[styles.tableCell, { width: '5%' }]}>
                  {index + 1}
                </Text>
                <View
                  style={{
                    width: '25%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start'
                  }}
                >
                  <Text style={[styles.tableCell, { fontWeight: 'semibold' }]}>
                    {student.refId}{' '}
                  </Text>
                  <Text style={[styles.tableCell, styles.grayText]}>
                    {student.collegeRoll}
                  </Text>
                </View>
                <View
                  style={{
                    width: '50%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start'
                  }}
                >
                  <Text style={styles.tableCell}>
                    {student.firstName} {student.lastName}
                  </Text>
                  <Text style={[styles.tableCell, styles.grayText]}>
                    {student.course}
                  </Text>
                </View>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  £{student.amount?.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalDetails}>
            {discountMsg && (
              <Text style={styles.discountMessage}>
                Discount Note: {discountMsg}
              </Text>
            )}
          </View>

          <View style={styles.totalCalculations}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>£{subtotal.toFixed(2)}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Discount (
                  {discountType === 'percentage'
                    ? `${discountAmount}%`
                    : 'Flat'}
                  ):
                </Text>
                <Text style={styles.totalValue}>
                  -£{discountValue.toFixed(2)}
                </Text>
              </View>
            )}

            {vat > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>VAT ({vat}%):</Text>
                <Text style={styles.totalValue}>£{vatAmount.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>
                £{totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
