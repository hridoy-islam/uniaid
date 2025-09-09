

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import moment from "moment";


// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop:"-30px",
    // marginLeft:"-20px"
  },
  
  sectionTitle: {
    fontSize: 11,
    fontWeight: "semibold",
    color: "#27245c",
    marginBottom: 5,
  },
  value: {
    fontSize: 10,
    fontWeight: "normal",
    marginBottom: 3,
  },
  twoColumnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: "Bold",
    paddingBottom: 2,
  },
  table: {
    display: "table",
    width: "100%",
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#27245c",
    
  },
  tableHeaderCell: {
    padding: 5,
    fontSize: 10,
    color: "white",
    fontWeight: "semibold",
    textAlign: "center",
    borderRightWidth: 2,
    borderRightColor: "#fff",
  },
  tableHeaderAmountCell: {
    padding: 5,
    fontSize: 10,
    color: "white",
    textAlign: "center",
    fontWeight: "semibold",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "center", // Center the content horizontally
    alignItems: "center", // Align content vertically in the center
  },
  tableCell: {
    padding: 5,
    paddingRight:10,
    fontSize: 10,
    fontWeight: "normal",
    textAlign: "center", // Center-align content in table cells
    // borderRightWidth: 2,
    borderRightColor: "#fff",
    flexDirection: "column",
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#27245c",
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
    backgroundColor: "#f3f3f3", // Light gray color for alternate rows
  },
});

const InvoicePDF = ({ invoice = {} }) => {


  





  const {
    remitTo = {
      name: "N/A",
      email: "N/A",
      address: "N/A",
      sortCode: "",
      accountNo: "",
      beneficiaryL: "",
    },
    reference = "",
    createdAt = "",
    semester = "",
    noOfStudents = 0,
    students = [],
    totalAmount = 0,
  } = invoice;


  return (
    <Document>
      <Page size="A4" style={styles.page}>
      
        <View style={styles.twoColumnContainer}>
          
          <View>
            <Text style={styles.sectionTitle}>REMIT TO</Text>
            <Text style={styles.label}>{remitTo.name}</Text>
            <Text style={styles.value}>Email: {remitTo.email}</Text>
            <Text style={styles.value}>Address: {remitTo.location}</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>REMIT REPORT</Text>
            <Text style={styles.value}>Reference: {reference}</Text>
            <Text style={styles.value}>Date: {moment(createdAt).format("Do MMM, YYYY")}</Text>
            <Text style={styles.value}>Semester: {semester}</Text>
            <Text style={styles.value}>No of Students: {noOfStudents}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
        <Text style={styles.value}>Sort Code: {remitTo.sortCode}</Text>
        <Text style={styles.value}>Account No: {remitTo.accountNo}</Text>
        <Text style={styles.value}>Beneficiary: {remitTo.beneficiary}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "5%" }]}>SL</Text>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>REFERENCE</Text>
            <Text style={[styles.tableHeaderCell, { width: "50%", textAlign: "left" }]}>NAME</Text>  

            <Text style={[ styles.tableHeaderAmountCell,{ width: "20%" }]}>AMOUNT</Text>
          </View>

          {students.map((student, index) => {
            // Apply light gray background for every odd row (index % 2 === 0 means even index, which is 1st, 3rd, etc.)
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
