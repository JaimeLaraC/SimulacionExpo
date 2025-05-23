import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TextInput, Button, Alert, Platform, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { getStockQuote, StockQuote } from '../src/api/finnhub';
import { buyStock, sellStock } from '../src/store/portfolio';
import { colors, typography, spacing, inputStyle } from '../src/theme'; // Import theme

type StockDetailScreenRouteParams = {
  symbol: string;
  description: string;
};
type StockDetailScreenRouteProp = RouteProp<{ Detail: StockDetailScreenRouteParams }, 'Detail'>;

const StockDetailScreen = () => {
  const route = useRoute<StockDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { symbol, description } = route.params;

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell' | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('1');

  const fetchQuote = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedQuote = await getStockQuote(symbol);
      if (fetchedQuote) {
        const defaultQuotePart = { c: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: Date.now() / 1000 };
        setQuote({ ...defaultQuotePart, ...fetchedQuote });
      } else {
        setError('Could not fetch quote data.');
      }
    } catch (err) {
      console.error("Error fetching stock quote:", err);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const openModal = (type: 'buy' | 'sell') => {
    setTransactionType(type);
    setQuantityInput('1');
    setModalVisible(true);
  };

  const handleTransaction = async () => {
    if (!transactionType || !quote || quote.c <= 0) {
      Alert.alert('Error', 'Cannot perform transaction. Stock price is unavailable.');
      return;
    }
    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number for quantity.');
      return;
    }
    let success = false;
    let message = '';
    if (transactionType === 'buy') {
      success = await buyStock(symbol, description, quantity, quote.c);
      message = success ? `Successfully bought ${quantity} share(s) of ${symbol}.` : 'Purchase failed. Check funds or try again.';
    } else {
      success = await sellStock(symbol, quantity, quote.c);
      message = success ? `Successfully sold ${quantity} share(s) of ${symbol}.` : 'Sale failed. Check holdings or try again.';
    }
    Alert.alert(success ? 'Success' : 'Failed', message);
    setModalVisible(false);
    if (success) {
        fetchQuote(); // Re-fetch quote to show updated data if any (though not directly affected by buy/sell)
        // PortfolioScreen will refresh on focus
    }
  };

  const formatPrice = (price: number | undefined) => price?.toFixed(2) ?? 'N/A';
  const formatPercentage = (dp: number | undefined) => dp?.toFixed(2) ?? 'N/A';

  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading quote for {symbol}...</Text></View>;
  }
  if (error) {
    return <View style={[styles.container, styles.centered]}><Text style={styles.errorText}>{error}</Text></View>;
  }
  if (!quote) {
    return <View style={[styles.container, styles.centered]}><Text style={styles.emptyText}>No quote data available for {symbol}.</Text></View>;
  }

  const priceChangeColor = quote.dp >= 0 ? colors.secondary : colors.accent;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{description} ({symbol})</Text>
      
      <View style={styles.detailsCard}>
        <View style={styles.quoteDetailRow}><Text style={styles.label}>Current Price:</Text><Text style={styles.value}>${formatPrice(quote.c)}</Text></View>
        <View style={styles.quoteDetailRow}><Text style={styles.label}>Change (%):</Text><Text style={[styles.value, { color: priceChangeColor }]}>{formatPercentage(quote.dp)}%</Text></View>
        <View style={styles.quoteDetailRow}><Text style={styles.label}>High:</Text><Text style={styles.value}>${formatPrice(quote.h)}</Text></View>
        <View style={styles.quoteDetailRow}><Text style={styles.label}>Low:</Text><Text style={styles.value}>${formatPrice(quote.l)}</Text></View>
        <View style={styles.quoteDetailRow}><Text style={styles.label}>Open:</Text><Text style={styles.value}>${formatPrice(quote.o)}</Text></View>
        <View style={styles.quoteDetailRow}><Text style={styles.label}>Previous Close:</Text><Text style={styles.value}>${formatPrice(quote.pc)}</Text></View>
        <Text style={styles.timestamp}>Last updated: {new Date(quote.t * 1000).toLocaleString()}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.transactionButton, { backgroundColor: colors.secondary }]} onPress={() => openModal('buy')}>
            <Text style={styles.buttonText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.transactionButton, { backgroundColor: colors.accent }]} onPress={() => openModal('sell')}>
            <Text style={styles.buttonText}>Sell</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{transactionType === 'buy' ? 'Buy Stock' : 'Sell Stock'}</Text>
            <Text style={styles.modalStockInfo}>{symbol} @ ${formatPrice(quote.c)}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter quantity"
              keyboardType="numeric"
              value={quantityInput}
              onChangeText={setQuantityInput}
            />
            <View style={styles.modalButtonGroup}>
                <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: transactionType === 'buy' ? colors.secondary : colors.accent }]} 
                    onPress={handleTransaction}
                >
                    <Text style={styles.buttonText}>Confirm {transactionType === 'buy' ? 'Buy' : 'Sell'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: colors.textSecondary, marginTop: spacing.s }]} 
                    onPress={() => setModalVisible(false)}
                >
                     <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.m,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: { marginTop: spacing.s, fontSize: typography.body.fontSize, color: colors.textSecondary },
  errorText: { fontSize: typography.body.fontSize, color: colors.accent, textAlign: 'center' },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.m,
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quoteDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timestamp: {
    fontFamily: typography.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.m,
  },
  transactionButton: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120, // Ensure buttons have a decent width
  },
  buttonText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight as any,
    color: colors.surface, // Assuming white text on colored buttons
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.l,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  modalStockInfo: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  modalInput: {
    ...inputStyle, // Use common input style from theme
    width: '100%', // Make input take full width of modal
    textAlign: 'center',
  },
  modalButtonGroup: {
    width: '100%',
    marginTop: spacing.s,
  },
  modalButton: {
    paddingVertical: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
});

export default StockDetailScreen;
