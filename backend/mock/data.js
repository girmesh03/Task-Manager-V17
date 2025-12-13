// backend/mock/data.js
export const mockData = [
  {
    organization: {
      data: {
        name: "elilly international hotel",
        description:
          "elilly international hotel is a 5 star hotel having 154 rooms and 5 restaurants",
        address: "addis ababa, Kazanchis Area Kirkos Subcity 17/18",
        phone: "+251115587777",
        email: "elilly@gmail.com",
        size: "Medium",
        industry: "Hospitality",
      },
      departments: [
        {
          data: {
            name: "engineering",
            description: "department of engineering",
          },
          users: [
            {
              firstName: "girmachew",
              lastName: "zewdie",
              email: "girmazewdei38@gmail.com",
              password: "12345678",
              position: "assistant chief engineer",
              role: "SuperAdmin",
            },
            {
              firstName: "ashenafi",
              lastName: "abeje",
              email: "ashenafi@gmail.com",
              password: "12345678",
              position: "chief engineer",
              role: "Admin",
            },
            {
              firstName: "terefe",
              lastName: "webetu",
              email: "terefe@gmail.com",
              password: "12345678",
              position: "electrical supervisor",
              role: "User",
            },
            {
              firstName: "bisrat",
              lastName: "wendafirash",
              email: "bisrat@gmail.com",
              password: "12345678",
              position: "electrician",
              role: "User",
            },
            {
              firstName: "yasin",
              lastName: "admasu",
              email: "yasin@gmail.com",
              password: "12345678",
              position: "painter",
              role: "User",
            },
          ],
        },
        {
          data: {
            name: "housekeeping",
            description: "department of housekeeping",
          },
          users: [
            {
              firstName: "seble",
              lastName: "desta",
              email: "seble@gmail.com",
              password: "12345678",
              position: "executive housekeeping manager",
              role: "Admin",
            },
            {
              firstName: "chala",
              lastName: "hk",
              email: "chala@gmail.com",
              password: "12345678",
              position: "assistant housekeeping manager",
              role: "Manager",
            },
            {
              firstName: "hiwot",
              lastName: "hk",
              email: "hiwot@gmail.com",
              password: "12345678",
              position: "housekeeping supervisor",
              role: "User",
            },
            {
              firstName: "chali",
              lastName: "hk",
              email: "chali@gmail.com",
              password: "12345678",
              position: "room attendant",
              role: "User",
            },
          ],
        },
      ],
    },
  },
  {
    organization: {
      data: {
        name: "capital hotel and spa",
        description:
          "capital hotel and spa is one of the best hotels in addis ababa",
        address: "around hayahulet",
        phone: "+251913493682",
        email: "capital@gmail.com",
        size: "Medium",
        industry: "Hospitality",
      },
      departments: [
        {
          data: {
            name: "engineering",
            description: "department of engineering",
          },
          users: [
            {
              firstName: "zewdu",
              lastName: "megersa",
              email: "zewdu@gmail.com",
              password: "12345678",
              position: "chief engineer",
              role: "SuperAdmin",
            },
            {
              firstName: "yemam",
              lastName: "kebed",
              email: "yemam@gmail.com",
              password: "12345678",
              position: "civil technician",
              role: "User",
            },
            {
              firstName: "abel",
              lastName: "kebed",
              email: "abel@gmail.com",
              password: "12345678",
              position: "assistant chief engineer",
              role: "Admin",
            },
            {
              firstName: "sami",
              lastName: "abebe",
              email: "sami@gmail.com",
              password: "12345678",
              position: "assistant chief engineer",
              role: "Manager",
            },
          ],
        },
      ],
    },
  },
];
