import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getPopularStocks, getStockQuote, StockSymbol, StockQuote } from '../src/api/finnhub';
import { MarketsStackParamList } from '../App'; 
import { colors, typography, spacing, cardStyle, inputStyle } from '../src/theme'; // Import theme

type StockData = StockSymbol & { quote: StockQuote | null };
type SearchScreenNavigationProp = StackNavigationProp<MarketsStackParamList, 'StockDetail'>;

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allStocks, setAllStocks] = useState<StockSymbol[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const navigation = useNavigation<SearchScreenNavigationProp>();

  useEffect(() => {
    const loadAllStocks = async () => {
      setLoading(true);
      try {
        const stocks = await getPopularStocks();
        setAllStocks(stocks);
      } catch (error) {
        console.error("Error fetching initial stock list:", error);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    loadAllStocks();
  }, []);

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredStocks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const lowerCaseQuery = query.toLowerCase();
      const results = allStocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(lowerCaseQuery) ||
          stock.description.toLowerCase().includes(lowerCaseQuery)
      );
      const detailedResults: StockData[] = await Promise.all(
        results.map(async (stock) => {
          const quote = await getStockQuote(stock.symbol);
          const defaultQuotePart = { c: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: Date.now() / 1000 };
          return { ...stock, quote: quote ? { ...defaultQuotePart, ...quote } : defaultQuotePart };
        })
      );
      setFilteredStocks(detailedResults);
    } catch (error) {
      console.error("Error during search:", error);
      setFilteredStocks([]);
    } finally {
      setLoading(false);
    }
  };
  
  const debouncedSearch = useCallback(debounce(performSearch, 300), [allStocks]);

  useEffect(() => {
    if (!initialLoad) { 
        if (searchQuery.trim()) {
            setLoading(true); 
            debouncedSearch(searchQuery);
        } else {
            setFilteredStocks([]); 
            setLoading(false);
        }
    }
  }, [searchQuery, debouncedSearch, initialLoad]);

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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by symbol or name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.placeholder}
      />
      {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}
      
      {!loading && searchQuery.trim() !== '' && filteredStocks.length === 0 && (
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.centeredMessageText}>No results found for "{searchQuery}".</Text>
        </View>
      )}

      {!loading && searchQuery.trim() === '' && !initialLoad && ( // Don't show on initial load before anything is typed
         <View style={styles.centeredMessageContainer}>
          <Text style={styles.centeredMessageText}>Enter a symbol or company name to search.</Text>
        </View>
      )}

      <FlatList
        data={filteredStocks}
        renderItem={renderItem}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={styles.listContainer}
        style={(searchQuery.trim() === '' || filteredStocks.length > 0) && !loading ? {} : { display: 'none' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.m, 
  },
  searchInput: {
    ...inputStyle, // Apply common input style
    marginHorizontal: spacing.m, // Use m for consistency
  },
  loader: {
    marginTop: spacing.l, // More space for loader
  },
  listContainer: {
    paddingHorizontal: spacing.s, // Consistent with MarketsScreen
  },
  itemContainer: {
    ...cardStyle, // Apply common card styling
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginHorizontal: spacing.s, // Removed as cardStyle now includes it
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
    fontSize: typography.h3.fontSize,
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
    fontWeight: '600',
    color: colors.textPrimary,
  },
  percentage: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  centeredMessageContainer: { // Renamed for clarity
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  centeredMessageText: { // Renamed for clarity
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default SearchScreen;
