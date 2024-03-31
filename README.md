**Getting Started with SecLang**

*Version 1.0*

### Table of Contents

[1. Setup and Usage](#1-setup-and-usage)  
[2. Language Basics](#2-language-basics)  
   1. [Data Types](#21-data-types)  
   2. [Variables and Constants](#22-variables-and-constants)  
   3. [Assignments](#23-assignments)  
   4. [Operators and Expressions](#24-operators-and-expressions)
      
[3. Control Flow](#3-control-flow)  
   1. [Conditional Statements](#31-conditional-statements)  
   2. [Looping Constructs](#32-looping-constructs)
      
[4. Channels](#4-channels)  
[5. Special Keywords](#5-special-keywords)

***

### 1. Setup and Usage
SecLang Web Interpreter is an educational tool designed to teach information flow security concepts using the SecLang programming language. SecLang is a programming language, created in the context of my master project, that incorporates information flow security concepts directly into its syntax, bridging the gap between theoretical knowledge and practical application.

### Prerequisites
-   **Deno**: Make sure you have Deno installed. You can download it from [Deno's official website](https://deno.land/).
- **Node.js and npm**: For the frontend part of the application, you need Node.js and npm. You can download them from [Node.js official website](https://nodejs.org/).

### How to Run

1.  **Clone the Repository:**
      
    `git clone git@github.com:MouadhKh/SecLang.git`
    
3.  **Run the Frontend:**
From the project's root directory run the following commands   
    `cd frontend`     
    `npm install`
    `npm run dev` 
    
    The frontend will be served on `http://localhost:3000`.
    
4.  **Run the Backend:**
    
From the project's root directory and run the following command  
    `cd backend`  
    `deno run --allow-write --allow-read api/app.ts`
    
 The backend server will start on `http://localhost:8000.
 
 **Make sure the backend application run on the defined port(8000)**
 
**Run the SecLang Interpreter Locally:**
  - Edit `config.json` and set the `environment` property to `dev`(it is prod by default).
  - Follow the instructions in `main.ts`
  - Run the following command in the project root directory:
   `deno run --allow-write --allow-read main.ts`
### How to Test
There are already two test suites for SecLang(the language not the web application) that you can run 
- For error handling tests:
`deno test --allow-read --allow-write test/error_handling.tests.ts`

- For channels tests:
```deno test --allow-read --allow-write test/channels.tests.ts```

### 2. Language Basics

#### 2.1 Data Types

SecLang supports the following data types:

- `int`: Integer values.
- `bool`: Boolean values (`true` or `false`).
- `string`: String values.

#### 2.2 Variables and Constants
Variables and constants are special in SecLang as they inherently security class. Variables and channels are annotated with security classes (`U` for Unclassified, `S` for Secret, `TS` for Top Secret) to indicate their sensitivity levels. Security annotations play a crucial role in explicit and implicit information flow control and are the core of SecLang. If not explicitly set, a variable/constant security class is set to `Unclassified` by default.

Variables are declared using the syntax:

```SecLang
type variableName : SecurityClass = value
```

Example:

```SecLang
int x : S = 10
bool flag : U = true
const string constant='SecLang'
```
#### 2.3 Assignments
Assignments should respect the information flow policy. Information flow x->y is only permissible if the security class of y is at least equal to x's.

#### 2.4 Operators and Expressions

SecLang supports common operators for arithmetic, and comparisons. Also Expressions follow standard precedence rules.

Example:

```SecLang
int result = x + 5 * 2
bool isValid = result==5
string greetings='HelloWorld'
greetings=greetings/2
greetings=greetings*3
```

### 3. Control Flow

Control structures create an implicit information flow so make sure your code complies with the information flow policy. Information is authorized to flow to equal or more secure variables/constants.
#### 3.1 Conditional Statements

SecLang's `if-then-else-endif` syntax allows conditional branching 

```SecLang
if condition then
    // Code to execute when condition is true
else
    // Code to execute when condition is false
endif
```

#### 3.2 Looping Constructs

SecLang provides `while` loops for iterative control flow.

```SecLang
while condition do
    // Code to execute while condition is true
endwhile
```



### 4. Channels 

SecLang includes preconfigured communication channels for secure data exchange. Channels are designed with specific security classes, ensuring secure inter-process communication.

Channel syntax following the pattern below
```SecLang
open('channelName,'accessMode') 
operations...
close('channelName')
```
Channels are predefined and are presentations of security classes: `Unclassified`,`Confidential`,`Secret`,`TopSecret`. They follow strict security rules and only allow secure data flows.
Examples:
The code example below is not authorized because we are trying to store a `Secret` information in a `Unclassified` variable.
```
open('Secret','r')
string x:U=read('Secret')
close('Secret')
```
 
#### 5. Special Keywords

SecLang support logging only constant values or `Unclassified` variables/constants. The used syntax is `debug 'SecLang greets you!'`

Security classes(or labels) is a central topic in SecLang. That's why we offer special functions to change the security label of a variable but only in one direction(down).

Example:
```
int x:TS
downgrade x
//At this stage, the security class of x is 
//Secret
declassify x
//Now, the security class of x is 
//Unclassified
```
