# Cryptocurrency Swap Bot

> A powerful Telegram bot for seamless cryptocurrency token swaps across multiple DEX aggregators on BNB Smart Chain

## Overview

This Telegram bot provides an intuitive, conversational interface for executing cryptocurrency swaps directly from your Telegram chat. Built with enterprise-grade architecture using NestJS and TypeScript, it aggregates liquidity from multiple decentralized exchanges to find the best swap rates for your trades.

## Supported Chains

- **BNB Smart Chain (BSC)** - Primary supported blockchain

## Integrated DEX Aggregators

The bot leverages multiple DEX aggregators to ensure optimal swap execution and competitive pricing:

### 1inch
- **SDK**: `@1inch/fusion-sdk`
- **Features**: Fusion Mode swaps with gasless transactions and MEV protection
- Aggregates liquidity across major DEXes for best pricing

### OKX DEX
- **SDK**: `@okx-dex/okx-dex-sdk`
- **Features**: Multi-chain DEX aggregation with optimized routing
- Includes custom BSC compatibility patches for legacy transaction support

### PancakeSwap
- **SDK**: `@pancakeswap/smart-router`
- **Features**: V2 and V3 liquidity pools with intelligent routing
- Native integration with BSC's largest DEX

### Jupiter *(Solana)*
- Solana's leading DEX aggregator
- Module prepared for future Solana integration

## Core Features

### Trading & Swaps
- Execute token swaps with multiple DEX options
- Real-time price quotes and comparisons
- Configurable slippage tolerance
- Support for both ERC-20 tokens and native BNB

### Smart Approvals
- Flexible approval strategies:
  - **Exact**: Only approve the required amount (safest)
  - **Multiple**: Approve a multiplier of swap amount (balanced)
  - **Unlimited**: One-time unlimited approval (most convenient)
- Automatic approval detection to prevent unnecessary transactions

### User Experience
- Clean, intuitive Telegram interface
- Preset quick-trade buttons for common amounts
- Custom amount input support
- Real-time swap status updates
- Transaction confirmation with explorer links

### Wallet Management
- Secure private key handling
- Multi-wallet support
- Balance checking across tokens
- Token metadata caching for performance

## Technical Architecture

### Backend Framework
- **NestJS** - Modular, scalable architecture
- **TypeScript** - Type-safe development
- **MongoDB** - User preferences and transaction history
- **Redis** - High-performance caching layer

### Blockchain Integration
- **Viem** - Modern, lightweight Ethereum library
- **Ethers.js v6** - Battle-tested Web3 library
- Custom provider implementations for chain-specific optimizations

### Message Queue
- **Telegraf** - Modern Telegram bot framework
- Scene-based navigation with inline keyboards
- Middleware for authentication and error handling

## Advanced Features

### Price Intelligence
- Token price aggregation from multiple sources
- Balance queries with real-time USD valuation
- Historical price tracking

### Performance Optimizations
- GraphQL integration for efficient subgraph queries
- Multicall batching for reduced RPC calls
- Token metadata caching (15-minute TTL)
- Connection pooling for database operations

### Error Handling & Reliability
- Comprehensive error logging with context
- Transaction retry mechanisms
- Graceful degradation when services are unavailable
- User-friendly error messages in Telegram

## Security Features

- Encrypted private key storage
- Input validation with Zod schemas
- Rate limiting and spam protection
- Transaction simulation before execution
- Slippage protection

## DEX Aggregator Selection

The bot intelligently selects the optimal DEX aggregator based on:
- Available liquidity
- Gas costs
- Slippage tolerance
- Token pair support
- User preferences

---

**Built with TypeScript, NestJS, and a passion for DeFi**
