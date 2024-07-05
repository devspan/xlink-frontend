"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Select,
  useToast,
  Heading,
  Container,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorMode,
  IconButton,
  Flex,
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowForwardIcon, SunIcon, MoonIcon } from "@chakra-ui/icons";

const RUPAYA_BRIDGE_ADDRESS = "0x8d89eB69A35C4573EeEC3D6a24Ff678858C24d41";
const BINANCE_BRIDGE_ADDRESS = "0xD8889654A3DF5E154247AaE60FE0fE8B089482D6";

const rupayaBridgeABI = [
  "function lockTokens() public payable",
  "function unlockTokens(address payable user, uint256 amount) external",
  "function lockedTokens(address) public view returns (uint256)",
  "event TokensLocked(address indexed user, uint256 amount, uint256 timestamp)",
  "event TokensUnlocked(address indexed user, uint256 amount, uint256 timestamp)",
];

const binanceBridgeABI = [
  "function mintTokens(address user, uint256 amount) external",
  "function burnTokens(address user, uint256 amount) external",
  "function balanceOf(address account) public view returns (uint256)",
  "event TokensMinted(address indexed user, uint256 amount, uint256 timestamp)",
  "event TokensBurned(address indexed user, uint256 amount, uint256 timestamp)",
];

const Bridge: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [fromToken, setFromToken] = useState("RUPX");
  const [toToken, setToToken] = useState("BRUPX");
  const [loading, setLoading] = useState(false);
  const [rupxBalance, setRupxBalance] = useState("0");
  const [brupxBalance, setBrupxBalance] = useState("0");
  const [networkName, setNetworkName] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();

  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const networkNames: { [key: number]: string } = {
    799: "rupaya-testnet",
    97: "bsc-testnet",
  };

  const fetchBalancesAndNetwork = useCallback(async () => {
    if (!isConnected || typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const network = await provider.getNetwork();
      const name = networkNames[network.chainId] || "unknown";
      setNetworkName(name);
      console.log(`Network details: ${JSON.stringify({ ...network, name })}`);

      if (name === "unknown") {
        console.log("Network is unknown. Cannot fetch balances.");
        return;
      }

      if (network.chainId === 97) { // BSC Testnet
        const binanceBridge = new ethers.Contract(
          BINANCE_BRIDGE_ADDRESS,
          binanceBridgeABI,
          provider
        );
        const brupxBalance = await binanceBridge.balanceOf(address);
        setBrupxBalance(ethers.utils.formatEther(brupxBalance));
        setRupxBalance("0");
      } else if (network.chainId === 799) { // Rupaya Testnet
        const rupxBalance = await provider.getBalance(address);
        setRupxBalance(ethers.utils.formatEther(rupxBalance));
        const rupayaBridge = new ethers.Contract(
          RUPAYA_BRIDGE_ADDRESS,
          rupayaBridgeABI,
          provider
        );
        const lockedTokens = await rupayaBridge.lockedTokens(address);
        setBrupxBalance(ethers.utils.formatEther(lockedTokens));
      } else {
        console.log("Connected to an unsupported network.");
        setRupxBalance("0");
        setBrupxBalance("0");
      }

      console.log(
        `Network: ${name}, RUPX Balance: ${ethers.utils.formatEther(rupxBalance)}, BRUPX Balance: ${ethers.utils.formatEther(brupxBalance)}`
      );
    } catch (error) {
      console.error("Error fetching balances and network:", error);
      setNetworkName("");
      setRupxBalance("0");
      setBrupxBalance("0");
    }
  }, [isConnected]);

  const checkConnection = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
          fetchBalancesAndNetwork();
        }
      } catch (error) {
        console.error("Failed to check connection:", error);
      }
    }
  }, [fetchBalancesAndNetwork]);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
          fetchBalancesAndNetwork();
        }
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    } else {
      toast({
        title: "MetaMask not detected",
        description: "Please install MetaMask to use this feature.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount("");
    setRupxBalance("0");
    setBrupxBalance("0");
    setNetworkName("");
  };

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected && window.ethereum) {
      fetchBalancesAndNetwork();
      const interval = setInterval(fetchBalancesAndNetwork, 30000);

      const handleNetworkChange = () => {
        fetchBalancesAndNetwork();
      };
      window.ethereum.on("networkChanged", handleNetworkChange);

      return () => {
        clearInterval(interval);
        window.ethereum.removeListener("networkChanged", handleNetworkChange);
      };
    }
  }, [isConnected, fetchBalancesAndNetwork]);

  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const switchNetwork = async (targetNetwork: "rupaya-testnet" | "bsc-testnet") => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const networkParams = {
      "rupaya-testnet": {
        chainId: "0x31F", // Rupaya Testnet chain ID (799 in decimal)
        chainName: "Rupaya Testnet",
        nativeCurrency: {
          name: "RUPX",
          symbol: "RUPX",
          decimals: 18,
        },
        rpcUrls: ["https://testnet-rpc.rupaya.io"],
        blockExplorerUrls: ["https://testnet-explorer.rupaya.io"],
      },
      "bsc-testnet": {
        chainId: "0x61", // BSC Testnet chain ID
        chainName: "BSC Testnet",
        nativeCurrency: {
          name: "tBNB",
          symbol: "tBNB",
          decimals: 18,
        },
        rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
        blockExplorerUrls: ["https://testnet.bscscan.com"],
      },
    };

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networkParams[targetNetwork].chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[targetNetwork]],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  const handleBridge = async () => {
    onClose();
    setLoading(true);
    try {
      const targetNetwork = fromToken === "RUPX" ? "rupaya-testnet" : "bsc-testnet";

      if (networkName !== targetNetwork) {
        await switchNetwork(targetNetwork);
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const amountWei = ethers.utils.parseEther(amount);

      let tx;
      if (fromToken === "RUPX") {
        const rupayaBridge = new ethers.Contract(
          RUPAYA_BRIDGE_ADDRESS,
          rupayaBridgeABI,
          signer
        );
        tx = await rupayaBridge.lockTokens({ value: amountWei });
      } else {
        const binanceBridge = new ethers.Contract(
          BINANCE_BRIDGE_ADDRESS,
          binanceBridgeABI,
          signer
        );
        tx = await binanceBridge.burnTokens(
          await signer.getAddress(),
          amountWei
        );
      }
      const receipt = await tx.wait();

      setTransactions((prev) => [
        {
          from: fromToken,
          to: toToken,
          amount,
          hash: receipt.transactionHash,
          timestamp: new Date().toLocaleString(),
        },
        ...prev.slice(0, 4),
      ]);

      toast({
        title: "Bridge Successful",
        description: `Bridged ${amount} ${fromToken} to ${toToken}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      fetchBalancesAndNetwork();
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
          <Heading
            as="h1"
            size="2xl"
            bgGradient="linear(to-r, #3498db, #2ecc71)"
            bgClip="text"
          >
            xLink Bridge
          </Heading>
          <HStack>
            {isConnected ? (
              <Button onClick={disconnectWallet}>
                Disconnect {account.slice(0, 6)}...{account.slice(-4)}
              </Button>
            ) : (
              <Button onClick={connectWallet}>Connect Wallet</Button>
            )}
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
            />
          </HStack>
        </Flex>

        <Box
          bg={bgColor}
          p={6}
          borderRadius="xl"
          boxShadow="xl"
          borderColor={borderColor}
          borderWidth={1}
        >
          <VStack spacing={6} align="stretch">
            <HStack justifyContent="space-between">
              <Box flex={1}>
                <Text mb={2} color={textColor}>
                  From
                </Text>
                <Select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  bg={bgColor}
                  color={textColor}
                  id="fromToken"
                >
                  <option value="RUPX">RUPX</option>
                  <option value="BRUPX">BRUPX</option>
                </Select>
              </Box>
              <IconButton
                aria-label="Swap tokens"
                icon={<ArrowForwardIcon />}
                onClick={handleSwap}
                variant="ghost"
                alignSelf="flex-end"
                _hover={{ bg: "transparent", transform: "rotate(180deg)" }}
                transition="all 0.3s"
              />
              <Box flex={1}>
                <Text mb={2} color={textColor}>
                  To
                </Text>
                <Select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  bg={bgColor}
                  color={textColor}
                  id="toToken"
                >
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
              id="amount"
            />
            <Button
              onClick={onOpen}
              colorScheme="blue"
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
            <Skeleton isLoaded={rupxBalance !== "0"}>
              <StatNumber color={textColor}>
                {parseFloat(rupxBalance).toFixed(4)}
              </StatNumber>
            </Skeleton>
            <StatHelpText>
              <StatArrow type="increase" />
              Updated in real-time
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel color={textColor}>BRUPX Balance</StatLabel>
            <Skeleton isLoaded={brupxBalance !== "0"}>
              <StatNumber color={textColor}>
                {parseFloat(brupxBalance).toFixed(4)}
              </StatNumber>
            </Skeleton>
            <StatHelpText>
              <StatArrow type="increase" />
              Updated in real-time
            </StatHelpText>
          </Stat>
        </HStack>

        {transactions.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color={textColor}>
              Recent Transactions
            </Heading>
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
                  <Tr key={tx.hash || index}>
                    <Td color={textColor}>{tx.from}</Td>
                    <Td color={textColor}>{tx.to}</Td>
                    <Td color={textColor}>{tx.amount}</Td>
                    <Td color={textColor}>{tx.timestamp}</Td>
                    <Td color={textColor}>Success</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader color={textColor}>
            Confirm Bridge Transaction
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={textColor}>
              Are you sure you want to bridge {amount} {fromToken} to {toToken}?
            </Text>
            <Text mt={4} color={textColor}>
              Please make sure you&apos;re connected to the correct network
              before proceeding.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleBridge}
              isLoading={loading}
            >
              Confirm
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Bridge;
