import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import moment from "moment";

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    marginTop:-40
  },
  // header: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   marginBottom: 20,
  // },
  logoContainer: {
    width: "100%",
    alignItems: "flex-start",
    paddingVertical: 5

    
  },
  logo: {
    width: "100px",
    height: "100px",
    objectFit: "contain"
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "semibold",
    color: "#00a185",
  
  },
  value: {
    fontSize: 10,
    fontWeight: "normal",
    marginBottom: 3,
  },
  twoColumnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  invoiceFromTo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  fromSection: {
    width: "45%",
  },
  toSection: {
    width: "45%",
  },
  label: {
    fontSize: 12,
    fontWeight: "Bold",
    paddingBottom: 2,
  },
  table: {
    display: "table",
    width: "100%",
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#00a185",
  },
  tableHeaderCell: {
    padding: 5,
    fontSize: 10,
    color: "white",
    textAlign: "center",
    borderRightWidth: 2,
    borderRightColor: "#fff",
  },
  tableHeaderAmountCell: {
    padding: 5,
    fontSize: 10,
    color: "white",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tableCell: {
    padding: 5,
    paddingRight: 10,
    fontSize: 10,
    fontWeight: "normal",
    textAlign: "center",
    borderRightColor: "#fff",
    flexDirection: "column",
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#00a185",
  },
  totalLabel: {
    width: "80%",
    padding: 5,
    fontSize: 11,
    fontWeight: "semibold",
    color: "white",
    textAlign: "right",
  },
  totalValue: {
    width: "20%",
    padding: 5,
    fontSize: 11,
    fontWeight: "semibold",
    color: "white",
    textAlign: "center"
  },
  grayText: {
    color: "#888",
  },
  grayBackground: {
    backgroundColor: "#f3f3f3",
  },
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
  totalAmount: number;
}

const InvoicePDF = ({ invoice = {} as Invoice }) => {
  
  const {
    createdBy = {} as CreatedBy,
    customer = {} as Customer,
    bank = {} as Bank,
    reference = "",
    date = new Date(),
    semester = "",
    noOfStudents = 0,
    students = [],
    totalAmount = 0,
  } = invoice;

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
            <Text style={styles.label}>{createdBy.name}</Text>
            <Text style={styles.value}>Email: {createdBy.email}</Text>
            <Text style={styles.value}>Address: {createdBy.location} {createdBy?.location2} </Text>
            <Text style={styles.value}>{createdBy?.city}{createdBy?.state} </Text>
            <Text style={styles.value}>{createdBy?.postCode}{createdBy?.country} </Text>
          </View>


          <View style={{ marginRight: 60 }}>
            <Text style={styles.sectionTitle}>INVOICE DETAILS</Text>
            <Text style={styles.value}>Semester: {semester}</Text>
            <Text style={styles.value}>No of Students: {noOfStudents}</Text>
            <Text style={styles.value}>Date: {moment(date).format("Do MMM, YYYY")}</Text>
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
            <Text style={styles.value}>Account No: { bank.accountNo}</Text>
            <Text style={styles.value}>Beneficiary: { bank.beneficiary}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "5%" }]}>SL</Text>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>REFERENCE</Text>
            <Text style={[styles.tableHeaderCell, { width: "50%", textAlign: "left" }]}>NAME</Text>
            <Text style={[styles.tableHeaderAmountCell, { width: "20%" }]}>AMOUNT</Text>
          </View>

          {students.map((student, index) => {
            const rowStyle = index % 2 !== 0 ? styles.grayBackground : {};
            return (
              <View style={[styles.tableRow, rowStyle]} key={index}>
                <Text style={[styles.tableCell, { width: "5%" }]}>{index + 1}</Text>
                <View style={{ width: "25%", display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }}>
                  <Text style={[styles.tableCell, { fontWeight: 'semibold' }]}>{student.refId} </Text>
                  <Text style={[styles.tableCell, styles.grayText]}>{student.collegeRoll}</Text>
                </View>
                <View style={{ width: "50%", display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }}>
                  <Text style={styles.tableCell}>
                    {student.firstName} {student.lastName}
                  </Text>
                  <Text style={[styles.tableCell, styles.grayText]}>{student.course}</Text>
                </View>
                <Text style={[styles.tableCell, { width: "20%" }]}>£{student.amount?.toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>£{totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;