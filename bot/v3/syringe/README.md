The syringe layer can hold up to 6ml of water and push it out on request. It is controlled through i2c.

![image](https://user-images.githubusercontent.com/2878523/111032377-c3d1b180-8403-11eb-955b-0c261758f9f8.png)

power usage estimate is 240mA for the 28BYJ-48 motor, and 10mA for the Arduino.

* when the motor is enabled: 1.25W
* when the motor is disabled: 0.05W

the 28BYJ-48 motor has 2038 steps per revolution. the gear reduction from the motor to the syringe-pushing rack is 14/8=1.75, and has teeth that are 3.142mm apart, so one step of the motor drives it 0.00088mm, or 0.001mm rounded.
