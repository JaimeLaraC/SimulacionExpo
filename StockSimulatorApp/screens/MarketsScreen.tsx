import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getPopularStocks, getStockQuote, StockSymbol, StockQuote } from '../src/api/finnhub';
import { MarketsStackParamList } from '../App'; 
import { colors, typography, spacing, cardStyle } from '../src/theme'; // Import theme

type StockData = StockSymbol & { quote: StockQuote | null };
type MarketsScreenNavigationProp = StackNavigationProp<MarketsStackParamList, 'MarketsList'>;

const MarketsScreen = () => {
  const [stocksData, setStocksData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<MarketsScreenNavigationProp>();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const popularStocks = await getPopularStocks();
        const detailedStocksData: StockData[] = await Promise.all(
          popularStocks.map(async (stock) => {
            const quote = await getStockQuote(stock.symbol);
            const defaultQuotePart = { c: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: Date.now() / 1000 };
            return { ...stock, quote: quote ? { ...defaultQuotePart, ...quote } : defaultQuotePart };
          })
        );
        setStocksData(detailedStocksData);
      } catch (error) {
        console.error("Error fetching stocks data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePressStock = (symbol: string, description: string) => {
    navigation.navigate('StockDetail', { symbol, description });
  };

  const renderItem = ({ item }: { item: StockData }) => {
    const priceChangeColor = item.quote && item.quote.dp >= 0 ? colors.secondary : colors.accent;
    const formatPrice = (price: number | undefined) => price?.toFixed(2) ?? 'N/A';
    const formatPercentage = (dp: number | undefined) => dp?.toFixed(2) ?? 'N/A';

    return (
      <TouchableOpacity onPress={() => handlePressStock(item.symbol, item.description)}>
        <View style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.symbol}>{item.displaySymbol}</Text>
            <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
              {item.description}
            </Text>
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.price}>${formatPrice(item.quote?.c)}</Text>
            <Text style={[styles.percentage, { color: priceChangeColor }]}>
              {formatPercentage(item.quote?.dp)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  if (!stocksData.length) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>No market data available at the moment.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stocksData}
      renderItem={renderItem}
      keyExtractor={(item) => item.symbol}
      contentContainerStyle={styles.listContainer}
      style={styles.container} // Ensure container style applies to FlatList view itself
      ListHeaderComponent={<Text style={styles.title}>Popular Stocks</Text>}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
  },
  loadingText: {
    marginTop: spacing.s,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  listContainer: {
    paddingHorizontal: spacing.s, // Use s for horizontal padding of list content
    paddingBottom: spacing.m,
  },
  title: {
    ...typography.h1, // Use h1 style from theme
    color: colors.textPrimary,
    marginTop: spacing.l, // More space for main title
    marginBottom: spacing.m,
    marginLeft: spacing.s, // Align with list items
  },
  itemContainer: {
    ...cardStyle, // Apply common card styling
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Removed marginHorizontal as cardStyle now includes it
  },
  itemHeader: {
    flex: 3,
  },
  itemDetails: {
    flex: 2,
    alignItems: 'flex-end',
  },
  symbol: {
    fontFamily: typography.fontFamily,
    fontSize: typography.h3.fontSize, // Use h3 style
    fontWeight: typography.h3.fontWeight as any,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: typography.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  price: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600', // Semi-bold for price
    color: colors.textPrimary,
  },
  percentage: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize, // Same size as price for consistency
    fontWeight: '500', // Medium weight
    marginTop: spacing.xs,
  },
});

export default MarketsScreen;
