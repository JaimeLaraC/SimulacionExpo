import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { initializePortfolio, Portfolio, PortfolioHolding } from '../src/store/portfolio';
import { getStockQuote, StockQuote } from '../src/api/finnhub';
import { colors, typography, spacing, cardStyle } from '../src/theme'; // Import theme

interface EnrichedPortfolioHolding extends PortfolioHolding {
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  priceChangePercent?: number; // To show daily change if available
}

const PortfolioScreen = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [enrichedHoldings, setEnrichedHoldings] = useState<EnrichedPortfolioHolding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number>(0);

  const loadPortfolioAndQuotes = useCallback(async () => {
    if (!refreshing) setLoading(true); // Only show full screen loader if not refreshing
    try {
      const currentPortfolio = await initializePortfolio();
      setPortfolio(currentPortfolio);

      if (currentPortfolio.holdings.length > 0) {
        const updatedHoldings: EnrichedPortfolioHolding[] = await Promise.all(
          currentPortfolio.holdings.map(async (holding) => {
            const quote = await getStockQuote(holding.symbol);
            const currentPrice = quote?.c ?? holding.purchasePrice; 
            const currentValue = holding.quantity * currentPrice;
            const gainLoss = currentValue - (holding.quantity * holding.purchasePrice);
            return {
              ...holding,
              currentPrice,
              currentValue,
              gainLoss,
              priceChangePercent: quote?.dp,
            };
          })
        );
        setEnrichedHoldings(updatedHoldings);
        
        const holdingsValue = updatedHoldings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
        setTotalPortfolioValue(currentPortfolio.cash + holdingsValue);

      } else {
        setEnrichedHoldings([]);
        setTotalPortfolioValue(currentPortfolio.cash);
      }
    } catch (error) {
      console.error("Error loading portfolio and quotes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]); // Add refreshing as a dependency

  useFocusEffect(
    useCallback(() => {
      loadPortfolioAndQuotes();
    }, [loadPortfolioAndQuotes])
  );
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPortfolioAndQuotes(); // This will now use refreshing=true
  }, [loadPortfolioAndQuotes]);


  const formatCurrency = (value: number | undefined, showSign = false) => {
    if (typeof value === 'undefined') return 'N/A';
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (typeof value === 'undefined') return 'N/A';
    return `${value.toFixed(2)}%`;
  }

  const renderHoldingItem = ({ item }: { item: EnrichedPortfolioHolding }) => {
    const gainLossColor = item.gainLoss && item.gainLoss >= 0 ? colors.secondary : colors.accent;
    const dailyChangeColor = item.priceChangePercent && item.priceChangePercent >= 0 ? colors.secondary : colors.accent;

    return (
      <View style={styles.holdingItemCard}>
        <View style={styles.holdingHeader}>
            <Text style={styles.holdingSymbol}>{item.symbol}</Text>
            <Text style={styles.holdingDescription} numberOfLines={1}>{item.description}</Text>
        </View>
        <View style={styles.holdingRow}>
            <Text style={styles.holdingLabel}>Quantity:</Text>
            <Text style={styles.holdingValue}>{item.quantity}</Text>
        </View>
        <View style={styles.holdingRow}>
            <Text style={styles.holdingLabel}>Avg. Purchase Price:</Text>
            <Text style={styles.holdingValue}>{formatCurrency(item.purchasePrice)}</Text>
        </View>
        <View style={styles.holdingRow}>
            <Text style={styles.holdingLabel}>Market Price:</Text>
            <View style={styles.marketPriceContainer}>
                <Text style={styles.holdingValue}>{formatCurrency(item.currentPrice)} </Text>
                {typeof item.priceChangePercent !== 'undefined' && (
                    <Text style={[styles.dailyChange, { color: dailyChangeColor }]}>
                        ({formatPercentage(item.priceChangePercent)})
                    </Text>
                )}
            </View>
        </View>
        <View style={styles.holdingRow}>
            <Text style={styles.holdingLabel}>Total Value:</Text>
            <Text style={styles.holdingValue}>{formatCurrency(item.currentValue)}</Text>
        </View>
        <View style={styles.holdingRow}>
            <Text style={styles.holdingLabel}>Total Gain/Loss:</Text>
            <Text style={[styles.holdingValue, { color: gainLossColor }]}>
            {formatCurrency(item.gainLoss, true)}
            </Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }
  
  if (!portfolio) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Could not load portfolio data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Portfolio Summary</Text>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cash Balance:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(portfolio.cash)}</Text>
        </View>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Holdings Value:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(enrichedHoldings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0))}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalValueRow]}>
            <Text style={styles.summaryLabelTotal}>Total Portfolio Value:</Text>
            <Text style={styles.summaryValueTotal}>{formatCurrency(totalPortfolioValue)}</Text>
        </View>
      </View>

      {enrichedHoldings.length === 0 && !loading ? ( // Check !loading to avoid flash of "no investments"
        <View style={[styles.centered, { paddingTop: spacing.xxl }]}>
          <Text style={styles.noHoldingsText}>You have no investments yet.</Text>
          <Text style={styles.infoText}>Use the Search tab to find stocks and make your first purchase!</Text>
        </View>
      ) : (
        <FlatList
          data={enrichedHoldings}
          renderItem={renderHoldingItem}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={<Text style={styles.holdingsTitle}>My Investments</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  loadingText: {
    marginTop: spacing.s,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: { // Changed from summaryContainer to summaryCard
    ...cardStyle, // Apply common card styling
    marginHorizontal: spacing.m, // Override horizontal margin if needed
    marginTop: spacing.m,
    // padding: spacing.l, // cardStyle has padding, can adjust if needed
  },
  summaryTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalValueRow: {
    borderBottomWidth: 0, // No border for the last row
    marginTop: spacing.s,
    paddingTop: spacing.s,
  },
  summaryLabelTotal: {
    fontFamily: typography.fontFamily,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight as any,
    color: colors.textPrimary,
  },
  summaryValueTotal: {
    fontFamily: typography.fontFamily,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight as any,
    color: colors.primary, // Use primary color for total value
  },
  listContainer: {
    paddingHorizontal: spacing.s, // Consistent with MarketsScreen
    paddingBottom: spacing.l, // More padding at the bottom
  },
  holdingsTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.l,
    marginBottom: spacing.m,
    marginLeft: spacing.s, // Align with card content
  },
  holdingItemCard: { // Renamed from holdingItem
    ...cardStyle, // Apply common card styling
    // marginHorizontal: spacing.s, // Removed as cardStyle includes it
  },
  holdingHeader: {
    marginBottom: spacing.s,
    paddingBottom: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingSymbol: {
    fontFamily: typography.fontFamily,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight as any,
    color: colors.textPrimary,
  },
  holdingDescription: {
    fontFamily: typography.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  holdingLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    flex: 1, // Allow label to take space
  },
  holdingValue: {
    fontFamily: typography.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  marketPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Align to the right
  },
  dailyChange: {
    fontFamily: typography.fontFamily,
    fontSize: typography.caption.fontSize, // Smaller for percentage
    marginLeft: spacing.xs,
  },
  noHoldingsText: {
    fontSize: typography.h3.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  infoText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  }
});

export default PortfolioScreen;
