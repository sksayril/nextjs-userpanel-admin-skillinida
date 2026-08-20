/** All 23 administrative districts of West Bengal (alphabetical). */
export const WEST_BENGAL_DISTRICTS = [
  "Alipurduar",
  "Bankura",
  "Birbhum",
  "Cooch Behar",
  "Dakshin Dinajpur",
  "Darjeeling",
  "Hooghly",
  "Howrah",
  "Jalpaiguri",
  "Jhargram",
  "Kalimpong",
  "Kolkata",
  "Malda",
  "Murshidabad",
  "Nadia",
  "North 24 Parganas",
  "Paschim Bardhaman",
  "Paschim Medinipur",
  "Purba Bardhaman",
  "Purba Medinipur",
  "Purulia",
  "South 24 Parganas",
  "Uttar Dinajpur",
] as const;

/** Comprehensive list of major districts and cities across all States and Union Territories of India. */
export const ALL_INDIA_DISTRICTS = [
  // West Bengal
  ...WEST_BENGAL_DISTRICTS,

  // Delhi NCR & UTs
  "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi",
  "Chandigarh", "Puducherry", "Andaman & Nicobar", "Dadra & Nagar Haveli", "Daman & Diu", "Lakshadweep", "Ladakh",

  // Maharashtra
  "Mumbai", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad (Chhatrapati Sambhajinagar)", "Solapur", "Amravati", "Kolhapur", "Navi Mumbai", "Palghar", "Raigad", "Satara", "Nanded", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur",

  // Uttar Pradesh
  "Agra", "Aligarh", "Prayagraj (Allahabad)", "Bareilly", "Ghaziabad", "Gorakhpur", "Jhansi", "Kanpur Nagar", "Kanpur Dehat", "Lucknow", "Mathura", "Meerut", "Moradabad", "Noida (Gautam Buddha Nagar)", "Varanasi", "Ayodhya", "Saharanpur", "Muzaffarnagar", "Firozabad", "Ballya", "Basti", "Gonda", "Mirzapur",

  // Bihar
  "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah (Bhojpur)", "Begusarai", "Katihar", "Munger", "Rohtas", "Samastipur", "Vaishali (Hajipur)", "Siwan", "Saran (Chhapra)", "Madhubani", "Nalanda", "East Champaran (Motihari)", "West Champaran (Bettiah)",

  // Assam & North East
  "Guwahati (Kamrup Metropolitan)", "Kamrup", "Dibrugarh", "Silchar (Cachar)", "Jorhat", "Nagaon", "Tezpur (Sonitpur)", "Tinsukia", "Barpeta", "Darrang", "Dhubri", "Goalpara", "Golaghat", "Hailakandi", "Karimganj", "Morigaon", "Sivasagar",
  "Agartala (West Tripura)", "Shillong (East Khasi Hills)", "Imphal East", "Imphal West", "Kohima", "Dimapur", "Aizawl", "Gangtok", "Itanagar (Papum Pare)",

  // Jharkhand
  "Ranchi", "Jamshedpur (East Singhbhum)", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Palamu", "Ramgarh", "Dumka", "West Singhbhum (Chaibasa)",

  // Odisha
  "Bhubaneswar (Khurda)", "Cuttack", "Rourkela (Sundargarh)", "Puri", "Sambalpur", "Balasore", "Berhampur (Ganjam)", "Bhadrak", "Baripada (Mayurbhanj)", "Jharsuguda", "Koraput",

  // Karnataka
  "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Mangaluru (Dakshina Kannada)", "Belagavi", "Kalaburagi", "Ballari", "Tumakuru", "Shivamogga", "Udupi", "Davangere",

  // Tamil Nadu
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore", "Tirunelveli", "Kanchipuram", "Thanjavur", "Cuddalore", "Dindigul", "Kanyakumari",

  // Telangana & Andhra Pradesh
  "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ranga Reddy", "Medchal-Malkajgiri",
  "Visakhapatnam", "Vijayawada (NTR)", "Guntur", "Nellore (SPSR Nellore)", "Kurnool", "Rajahmundry (East Godavari)", "Tirupati", "Anantapur", "Kadapa (YSR)", "Eluru", "Kakinada",

  // Gujarat
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Kutch", "Bharuch", "Mehsana", "Valsad",

  // Rajasthan
  "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bhilwara", "Sikar", "Sri Ganganagar", "Bharatpur", "Pali", "Chittorgarh",

  // Punjab & Haryana
  "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali (SAS Nagar)", "Hoshiarpur", "Pathankot", "Gurdaspur",
  "Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat", "Yamunanagar", "Panchkula",

  // Madhya Pradesh & Chhattisgarh
  "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Ratlam", "Rewa", "Satna", "Dewas",
  "Raipur", "Bhilai (Durg)", "Bilaspur", "Korba", "Rajnandgaon", "Jagdalpur (Bastar)",

  // Kerala
  "Thiruvananthapuram", "Kochi (Ernakulam)", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Kannur", "Kottayam", "Alappuzha", "Malappuram", "Idukki", "Wayanad",

  // Uttarakhand & Himachal Pradesh
  "Dehradun", "Haridwar", "Roorkee", "Haldwani (Nainital)", "Udham Singh Nagar", "Pauri Garhwal",
  "Shimla", "Dharamshala (Kangra)", "Mandi", "Solan", "Kullu", "Hamirpur",

  // Jammu & Kashmir
  "Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Kathua", "Pulwama"
] as const;

export type WestBengalDistrict = (typeof WEST_BENGAL_DISTRICTS)[number];

export function isValidWestBengalDistrict(value: string): boolean {
  return (WEST_BENGAL_DISTRICTS as readonly string[]).includes(value);
}

export function isValidDistrict(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
