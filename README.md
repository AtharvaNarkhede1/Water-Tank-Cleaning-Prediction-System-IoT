# ESP32 pH Sensor Interface 🔬

This project demonstrates how to safely interface a standard 5V analog pH sensor with a 3.3V ESP32 microcontroller. It includes the necessary hardware circuit (a voltage divider) and the Arduino code to read the sensor's output, perform the necessary voltage calculations, and display the results.

The core challenge addressed here is stepping down the 5V analog signal from the sensor to a 3.3V level that is safe for the ESP32's ADC (Analog-to-Digital Converter) pin.

---

## ⚡ Key Features

* Reads analog data from a common pH sensor module.
* Safely interfaces a 5V sensor with a 3.3V microcontroller using a voltage divider.
* The software accurately calculates the sensor's original 0-5V signal from the scaled-down input.
* Outputs both the voltage at the ESP32 pin and the original sensor voltage to the Serial Monitor for easy debugging and calibration.

---

## 🔌 Hardware Required

* An ESP32 Development Board
* An Analog pH Sensor Kit (one that is powered by 5V)
* 1x **2 kΩ Resistor** (R1)
* 1x **3.3 kΩ Resistor** (R2)
* A Breadboard
* Jumper Wires

---

## 💡 Wiring and Setup

⚠️ **CRITICAL WARNING:** Do **NOT** connect the sensor's 5V analog output directly to any ESP32 GPIO pin. This will permanently damage your board. You **must** use the voltage divider circuit described below.

The voltage divider steps down the sensor's 0-5V signal to a safe 0-3.1V range for the ESP32.

### Circuit Diagram:

Connect the components as follows:

`[pH Sensor Signal Pin] --- [ 2 kΩ Resistor ] ---+--- [ 3.3 kΩ Resistor ] --- [GND]`
`                                               |`
`                                               +--- [ESP32 GPIO 34]`

### Step-by-Step Connections:
1.  **Sensor Power:**
    * Connect the sensor's **VCC** pin to a **5V** power source.
    * Connect the sensor's **GND** pin to **GND**.
2.  **Signal Path:**
    * Connect the sensor's **Analog Output (PO)** pin to one end of the **2 kΩ resistor (R1)**.
    * Connect the other end of the **2 kΩ resistor** to your chosen ESP32 analog pin (e.g., **GPIO 34**).
    * From that same point (GPIO 34), connect one end of the **3.3 kΩ resistor (R2)** to **GND**.

---

## 💻 How It Works

The software logic performs the following steps:

1.  **Reads the ADC Value:** It reads the raw digital value (0-4095) from the specified GPIO pin.
2.  **Calculates Pin Voltage:** It converts this digital value to the actual voltage being seen at the ESP32 pin (a value between 0V and 3.3V).
3.  **Calculates Original Voltage:** It then uses the inverse of the voltage divider formula to calculate what the sensor's original output voltage was (a value between 0V and 5V).
4.  **Prints to Serial:** Both voltages are printed to the Serial Monitor for analysis.

---

## 🚀 Usage

1.  Assemble the hardware circuit as described above.
2.  Open the `.ino` file in the Arduino IDE.
3.  Make sure you have the ESP32 board definitions installed.
4.  Select your ESP32 board and the correct COM port from the `Tools` menu.
5.  Upload the code.
6.  Open the **Serial Monitor** and set the baud rate to **9600** to view the voltage readings.
