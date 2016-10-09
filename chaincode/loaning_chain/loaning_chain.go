/*
Copyright IBM Corp 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"encoding/json"
	"os"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {

}

type Proposal struct {
	Id string
	From string
	To string
}

type LoaningChainState struct {
	//Proposals []Proposal
	Name string
}

func (t *SimpleChaincode) LoadChainState(stub *shim.ChaincodeStub) (LoaningChainState, error) {
	var state LoaningChainState

	stateBytes, err := stub.GetState("loaningChainState")
	if err != nil {
		return state, err
	}

	err2 := json.Unmarshal(stateBytes, &state)
	if err2 != nil {
		return state, err2
	}
	return state, nil
}

func (t *SimpleChaincode) SaveChainState(stub *shim.ChaincodeStub, state LoaningChainState) (error) {
	bytes, err := json.Marshal(state)
	if err != nil {
		return err
	}
	return stub.PutState("loaningChainState", bytes)
}

// ============================================================================================================================
// Main
// ============================================================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Fprintln(os.Stdout, "Error starting Simple chaincode: %s", err)
	}
}

// Init resets all the things
func (t *SimpleChaincode) Init(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Fprintln(os.Stdout, "Initializing loaning chain. function %s", function)
	err := t.SaveChainState(stub, LoaningChainState{Name: function})
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// Invoke is our entry point to invoke a chaincode function
func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	switch function {
	case "init":
		return t.Init(stub, "init", args)
	case "write_key":
		return t.write_key(stub, args)
	default:
		errorMessage := fmt.Sprintf("unsupported invoke function %s", function)
		fmt.Println(errorMessage)
		return nil, errors.New(errorMessage)
	}

	fmt.Fprintln(os.Stdout, "invoke did not find func: %s", function)					//error

	return nil, errors.New("Received unknown function invocation")
}

// Query is our entry point for queries
func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	state, err := t.LoadChainState(stub)
	if err != nil {
		fmt.Fprintln(os.Stdout, "Failed to loan chain state: %s", err)
		return nil, err
	}

	switch function {
	case "read_chain_name":
		fmt.Fprintln(os.Stdout, "Returning chain name: %s", state.Name)
		return []byte(state.Name), nil
	case "read_key":
		return t.read_key(stub, args)
	default:
		errorMessage := fmt.Sprintf("unsupported query function %s", function)
		fmt.Println(errorMessage)
		return nil, errors.New(errorMessage)
	}
}

func (t *SimpleChaincode) write_key(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var key, value string
	var err error
	fmt.Println("running write_key()")

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2. name of the key and value to set")
	}

	key = args[0]                            //rename for fun
	value = args[1]
	fmt.Fprintln(os.Stdout, "writing key: %s, value: %s", key, value)
	err = stub.PutState(key, []byte(value))  //write the variable into the chaincode state
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (t *SimpleChaincode) read_key(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var key, jsonResp string
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the key to query")
	}

	key = args[0]

	fmt.Println("Reading key: %s", key)

	valAsbytes, err := stub.GetState(key)
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + key + "\"}"
		return nil, errors.New(jsonResp)
	}

	fmt.Fprintln(os.Stdout, "Returning key: %s, value: %s", key, valAsbytes)

	return valAsbytes, nil
}
