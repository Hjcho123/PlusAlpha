import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "@/services/api";
import { StockData } from "@/services/api";

interface SearchSuggestionsProps {
  onStockSelect: (symbol: string) => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

interface SuggestionItem extends StockData {
  displayText: string;
  subText: string;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  onStockSelect,
  placeholder = "Search stocks (AAPL, TSLA, etc.)",
  disabled = false,
  value = '',
  onChange
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Format currency for suggestions
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage for suggestions
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Debounced search function
  const searchStocks = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const results = await api.stock.searchStocks(searchQuery, 8);

      const formattedSuggestions: SuggestionItem[] = results.map(stock => ({
        ...stock,
        displayText: `${stock.symbol} - ${stock.name}`,
        subText: `${formatCurrency(stock.price)} ${formatPercentage(stock.changePercent)}`
      }));

      setSuggestions(formattedSuggestions);
      setIsOpen(formattedSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync external value prop with internal state
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setQuery(newValue);

    // Call external onChange if provided
    if (onChange) {
      onChange(newValue);
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      searchStocks(newValue);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && query) {
        onStockSelect(query);
        setQuery('');
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (query) {
          onStockSelect(query);
          setQuery('');
          setIsOpen(false);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    setQuery(suggestion.symbol);
    setIsOpen(false);
    setSelectedIndex(-1);
    onStockSelect(suggestion.symbol);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex-1">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(suggestions.length > 0)}
          disabled={disabled}
          className="bg-input border-border text-foreground pr-8"
          autoComplete="off"
        />

        {/* Dropdown indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-auto"
        >
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {suggestions.length > 0 ? (
                <div className="py-2">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.symbol}-${index}`}
                      className={`px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                        index === selectedIndex ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">
                            {suggestion.displayText}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {suggestion.subText}
                          </div>
                        </div>
                        <Badge
                          variant={suggestion.changePercent >= 0 ? 'default' : 'destructive'}
                          className={`ml-2 text-xs ${
                            suggestion.changePercent >= 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          {suggestion.changePercent >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {formatPercentage(suggestion.changePercent)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  {loading ? 'Searching stocks...' : 'No stocks found'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
