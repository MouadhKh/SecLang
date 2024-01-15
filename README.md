**SecLang Developer's Guide**

*Version 1.0*

### Table of Contents
[1. Introduction](#1-introduction)  
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

### 1. Introduction

Welcome to the SecLang Developer's Guide! SecLang is a security-focused domain-specific language designed to provide explicit and implicit information flow control. This guide will walk you through the fundamental aspects of the language, empowering you to write secure code and harness SecLang's powerful features.

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
#### 2.3 Assignment
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
 
#### 5.Special keywords

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
