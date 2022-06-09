import '../index.css';
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Container, Row, Form, FormGroup, Button, Table, Spinner } from 'react-bootstrap';
import Web3 from 'web3'
import BettingGame from '../abi/BettingGame.json'

function ThreeStar() {
    const [userInfo, setUserInfo] = useState({
        account: null,
        amount: null,
        balance: null,
        contract: null,
        event: null,
        loading: false,
        network: null,
        maxBet: 0,
        minBet: 0,
        bet: [],
        random: [],
        web3: null,
        wrongNetwork: false,
        contractAddress: null,
        result: null,
    })

    const [betAmount, setBetAmount] = useState(0)

    const loadWeb3 = async () => {
        if (typeof window.ethereum !== 'undefined' && !userInfo.wrongNetwork) {
            let accounts, network, balance, web3, maxBet, minBet, contract, contract_abi, contract_address

            //don't refresh DApp when user change the network
            window.ethereum.autoRefreshOnNetworkChange = false;

            web3 = new Web3(window.ethereum)
            setUserInfo(userInfo => ({ ...userInfo, web3: web3 }))

            contract_abi = BettingGame.abi;
            contract_address = '0x07D94949fb4f0E4bab27b660786662CcDb8f03ba' //tt-test
            contract = new web3.eth.Contract(contract_abi, contract_address);
            accounts = await web3.eth.getAccounts()

            //Update the data when user initially connect
            if (typeof accounts[0] !== 'undefined' && accounts[0] !== null) {
                balance = await web3.eth.getBalance(accounts[0])
                maxBet = await web3.eth.getBalance(contract_address)
                minBet = 0
                /*const test = await contract.methods.withdrawEther(web3.utils.toWei("490000000000000000")).call()
                console.log(test)*/
                setUserInfo(userInfo => ({ ...userInfo, account: accounts[0], balance: balance, minBet: minBet, maxBet: maxBet }))
            }

            setUserInfo(userInfo => ({
                ...userInfo,
                contract: contract,
                contractAddress: contract_address
            }))

            //Update account&balance when user change the account
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (typeof accounts[0] !== 'undefined' && accounts[0] !== null) {
                    balance = await web3.eth.getBalance(accounts[0])
                    maxBet = await web3.eth.getBalance(contract_address)
                    minBet = 0

                    setUserInfo(userInfo => ({ ...userInfo, account: accounts[0], balance: balance, minBet: 0, maxBet: maxBet }))
                } else {
                    setUserInfo(userInfo => ({ ...userInfo, account: null, balance: 0 }))
                }
            });

            //Update data when user switch the network
            window.ethereum.on('chainChanged', async (chainId) => {
                network = parseInt(chainId, 16)
                console.log(network)
                if (network === 18) {
                    setUserInfo(userInfo => ({ ...userInfo, wrongNetwork: true }))
                } else {
                    if (this.state.account) {
                        balance = await this.state.web3.eth.getBalance(this.state.account)
                        maxBet = await this.state.web3.eth.getBalance(this.state.contractAddress)
                        minBet = await this.state.contract.methods.weiInUsd().call()

                        setUserInfo(userInfo => ({ ...userInfo, balance: balance, maxBet: maxBet, minBet: minBet }))
                    }
                    setUserInfo(userInfo => ({ ...userInfo, network: network, loading: false, onlyNetwork: false, wrongNetwork: false }))
                }
            });
        }else{
            console.log("wrongNetwork")
        }
    }

    const makeDesignArray = async (array) => {
        let clearArray = []
        for (let i = 0; i < array.length; i++) {
            if (i === array.length - 1)
                clearArray.push(array[i])
            else
                clearArray.push(array[i] + '、')
        }
        return clearArray
    }

    const makeBet = async () => {
        const networkId = await userInfo.web3.eth.net.getId()
        if (networkId !== 18) {
            setUserInfo(userInfo => ({ ...userInfo, wrongNetwork: true }))
        } else if (typeof userInfo.account !== 'undefined' && userInfo.account !== null) {
            /*
            let bet = [1,2,3]
            while (bet.length < 3) {
                const temp = Math.floor(Math.random() * 80) + 1
                if (!bet.includes(temp))
                    bet.push(temp)
            }
            const betArray = await makeDesignArray(bet.sort(function (a, b) { return a - b }))
            let random = [1,2,3]
            
            while (random.length < 20) {
                const temp = Math.floor(Math.random() * 80) + 1
                if (!random.includes(temp))
                    random.push(temp)
            }
            const randomArray = await makeDesignArray(random.sort(function (a, b) { return a - b }))
            */
            const betArray = [1,2,3]
            const randomArray = [1,2,3]
            //Send bet to the contract and wait for the verdict
            userInfo.contract.methods.game(betArray, randomArray).send({ from: userInfo.account, value: userInfo.web3.utils.toWei(betAmount) }).on('transactionHash', (hash) => {
                setUserInfo(userInfo => ({ ...userInfo, loading: true }))
                console.log("into contract")
                userInfo.contract.events.Result({}, async (error, event) => {
                    console.log("success")
                    const verdict = event.returnValues.winAmount
                    if (verdict === '0') {
                        setUserInfo(userInfo => ({ ...userInfo, result: 'You Lose :(' }))
                    } else {
                        setUserInfo(userInfo => ({ ...userInfo, result: 'WIN!' }))
                    }

                    //Prevent error when user logout, while waiting for the verdict
                    if (userInfo.account !== null && typeof userInfo.account !== 'undefined') {
                        const balance = await userInfo.web3.eth.getBalance(userInfo.account)
                        const maxBet = await userInfo.web3.eth.getBalance(userInfo.contractAddress)
                        setUserInfo(userInfo => ({ ...userInfo, balance: balance, maxBet: maxBet }))
                    }
                    setUserInfo(userInfo => ({ ...userInfo, bet: betArray }))
                    setUserInfo(userInfo => ({ ...userInfo, random: randomArray }))
                    console.log("end")
                    setUserInfo(userInfo => ({ ...userInfo, loading: false }))
                }).on('error', (error) => {
                    window.alert('Error')
                })
                console.log("over")
            })
        }
    }

    useEffect(() => {
        loadWeb3()
    }, [])

    return (
        <>
            <Container>
                <Row xs={1} md={1}>
                    <Col>{userInfo.account}</Col>
                </Row>
                <Row xs={1} md={2}>
                    <Col><Form.Label>您要下注的數量：</Form.Label></Col>
                    <Col><Form.Control placeholder={userInfo.amount} value={userInfo.amount} onChange={(e) => { setBetAmount(e.target.value) }}></Form.Control></Col>
                    <Col><Button onClick={makeBet}>下注</Button></Col>
                </Row>
                <Row>
                    <Col>MaxBet:{Number(userInfo.maxBet) / 1000000000000000000}</Col>
                    <Col>Balance:{Number(userInfo.balance) / 1000000000000000000}</Col>
                </Row>
            </Container>

        </>

    );
}

export default ThreeStar;
