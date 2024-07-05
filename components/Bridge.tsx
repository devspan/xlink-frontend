'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Box, VStack, HStack, Text, Input, Button, Select, useToast,
  Heading, Container, Divider, Stat, StatLabel, StatNumber,
  StatHelpText, StatArrow, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, Badge, Tooltip,
  useColorMode, IconButton, Flex, Skeleton, useColorModeValue
} from '@chakra-ui/react';
import { ArrowForwardIcon, SunIcon, MoonIcon } from '@chakra-ui/icons';
import { RUPX_LOCKER_ADDRESS, RUPX_BRIDGE_ADDRESS, BRUPX_TOKEN_ADDRESS } from '../config';

const rupxLockerABI = ["function lockRUPX(bytes32 _transactionId) payable"];
const rupxBridgeABI = ["function burnBRUPX(uint256 _amount, bytes32 _transactionId)"];
const erc20ABI = ["function balanceOf(address owner) view returns (uint256)"];

const Bridge: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [fromToken, setFromToken] = useState('RUPX');
  const [toToken, setToToken] = useState('BRUPX');
  const [loading, setLoading] = useState(false);
  const [rupxBalance, setRupxBalance] = useState('0');
  const [brupxBalance, setBrupxBalance] = useState('0');
  const [networkName, setNetworkName] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchBalancesAndNetwork = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        const rupxBalance = await provider.getBalance(address);
        setRupxBalance(ethers.utils.formatEther(rupxBalance));

        const brupxToken = new ethers.Contract(BRUPX_TOKEN_ADDRESS, erc20ABI, provider);
        const brupxBalance = await brupxToken.balanceOf(address);
        setBrupxBalance(ethers.utils.formatEther(brupxBalance));

        const network = await provider.getNetwork();
        setNetworkName(network.name);
      } catch (error) {
        console.error("Error fetching balances and network:", error);
        setNetworkName('');
      }
    };

    fetchBalancesAndNetwork();
    const interval = setInterval(fetchBalancesAndNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleBridge = async () => {
    onClose();
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const transactionId = ethers.utils.id(Date.now().toString());
      const amountWei = ethers.utils.parseEther(amount);

      let tx;
      if (fromToken === 'RUPX') {
        const rupxLocker = new ethers.Contract(RUPX_LOCKER_ADDRESS, rupxLockerABI, signer);
        tx = await rupxLocker.lockRUPX(transactionId, { value: amountWei });
      } else {
        const rupxBridge = new ethers.Contract(RUPX_BRIDGE_ADDRESS, rupxBridgeABI, signer);
        tx = await rupxBridge.burnBRUPX(amountWei, transactionId);
      }
      await tx.wait();

      setTransactions(prev => [{
        from: fromToken,
        to: toToken,
        amount,
        hash: tx.hash,
        timestamp: new Date().toLocaleString()
      }, ...prev.slice(0, 4)]);

      toast({
        title: "Bridge Successful",
        description: `Bridged ${amount} ${fromToken} to ${toToken}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Bridge Failed",
        description: "An error occurred while bridging tokens.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Container maxW="container.lg" p={8}>
      <VStack spacing={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="2xl" bgGradient="linear(to-r, #3498db, #2ecc71)" bgClip="text">
            xLink Bridge
          </Heading>
          <HStack>
            <Tooltip label={networkName ? `Connected to ${networkName}` : 'Not connected'}>
              <Badge colorScheme={networkName === 'rupaya-testnet' || networkName === 'bsc-testnet' ? 'green' : 'red'}>
                {networkName || 'NOT CONNECTED'}
              </Badge>
            </Tooltip>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
            />
          </HStack>
        </Flex>
        <Box bg={bgColor} p={6} borderRadius="xl" boxShadow="xl" borderColor={borderColor} borderWidth={1}>
          <VStack spacing={6}>
            <HStack w="full" justifyContent="space-between">
              <Box w="45%">
                <Text mb={2} color={textColor}>From</Text>
                <Select value={fromToken} onChange={(e) => setFromToken(e.target.value)} bg={bgColor} color={textColor}>
                  <option value="RUPX">RUPX</option>
                  <option value="BRUPX">BRUPX</option>
                </Select>
              </Box>
              <IconButton
                aria-label="Swap tokens"
                icon={<ArrowForwardIcon />}
                onClick={handleSwap}
                variant="ghost"
                _hover={{ bg: 'transparent', transform: 'rotate(180deg)' }}
                transition="all 0.3s"
              />
              <Box w="45%">
                <Text mb={2} color={textColor}>To</Text>
                <Select value={toToken} onChange={(e) => setToToken(e.target.value)} bg={bgColor} color={textColor}>
                  <option value="BRUPX">BRUPX</option>
                  <option value="RUPX">RUPX</option>
                </Select>
              </Box>
            </HStack>
            <Input
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              bg={bgColor}
              color={textColor}
            />
            <Button
              colorScheme="blue"
              onClick={onOpen}
              isFullWidth
              bgGradient="linear(to-r, #3498db, #2ecc71)"
              _hover={{
                bgGradient: "linear(to-r, #2980b9, #27ae60)",
              }}
            >
              Bridge Tokens
            </Button>
          </VStack>
        </Box>
        <Divider />
        <HStack justifyContent="space-between">
          <Stat>
            <StatLabel color={textColor}>RUPX Balance</StatLabel>
            <Skeleton isLoaded={rupxBalance !== '0'}>
              <StatNumber color={textColor}>{parseFloat(rupxBalance).toFixed(4)}</StatNumber>
            </Skeleton>
            <StatHelpText>
              <StatArrow type="increase" />
              Updated in real-time
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel color={textColor}>BRUPX Balance</StatLabel>
            <Skeleton isLoaded={brupxBalance !== '0'}>
              <StatNumber color={textColor}>{parseFloat(brupxBalance).toFixed(4)}</StatNumber>
            </Skeleton>
            <StatHelpText>
              <StatArrow type="increase" />
              Updated in real-time
            </StatHelpText>
          </Stat>
        </HStack>
        <Box>
          <Heading size="md" mb={4} color={textColor}>Recent Transactions</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color={textColor}>From</Th>
                <Th color={textColor}>To</Th>
                <Th color={textColor}>Amount</Th>
                <Th color={textColor}>Timestamp</Th>
                <Th color={textColor}>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((tx, index) => (
                <Tr key={index}>
                  <Td color={textColor}>{tx.from}</Td>
                  <Td color={textColor}>{tx.to}</Td>
                  <Td color={textColor}>{tx.amount}</Td>
                  <Td color={textColor}>{tx.timestamp}</Td>
                  <Td>
                    <Badge colorScheme="green">Success</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader color={textColor}>Confirm Bridge Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={textColor}>Are you sure you want to bridge {amount} {fromToken} to {toToken}?</Text>
            <Text mt={4} color={textColor}>Please make sure you're connected to the correct network before proceeding.</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleBridge} isLoading={loading}>
              Confirm
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Bridge;