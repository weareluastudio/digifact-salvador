/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
function convertToWords(input: { split: (arg0: string) => [any, any] }) {
  const numberWords = [
    "cero",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ];
  const tensWords = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];
  const specialWords = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ];

  function convertNumberToWords(number: number) {
    let words = "";
    if (number >= 1000) {
      if (number >= 2000) {
        words += convertNumberToWords(Math.floor(number / 1000)) + " ";
      } else {
        words += "mil ";
      }
      number %= 1000;
    }

    if (number >= 100) {
      words += numberWords[Math.floor(number / 100)] + "cientos ";
      number %= 100;
    }

    if (number >= 10 && number <= 19) {
      words += specialWords[number - 10];
    } else {
      if (number >= 20) {
        words += tensWords[Math.floor(number / 10)];
        if (number % 10 !== 0) {
          words += " y " + numberWords[number % 10];
        }
      } else {
        words += numberWords[number % 10];
      }
    }

    return words.trim();
  }

  // @ts-ignore
  const wholeWords = convertNumberToWords(parseInt(input));
  const decimalWords = "dolares con 00/100";
  const result = wholeWords + " " + decimalWords;
  return result;
}

export const toFixed = (n: number) => {
  const nParts = n.toString().split(".");
  const result =
    nParts.length > 1 ?
      `${nParts[0]}.${nParts[1].substring(0, 2)}` :
      n.toString();

  return result;
};

export default convertToWords;
