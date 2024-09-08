import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import parse_homeworks from "@/utils/format/format_pronote_homeworks";
import { getSubjectData } from "@/services/shared/Subject";
import { useTheme } from "@react-navigation/native";
import type { Homework } from "@/services/shared/Homework";
import { NativeItem, NativeText } from "@/components/Global/NativeComponents";
import PapillonCheckbox from "@/components/Global/PapillonCheckbox";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

const HomeworkItem = React.memo(({ homework, onDonePressHandler, index, total }: {
  homework: Homework,
  onDonePressHandler: () => unknown,
  index: number,
  total: number
}) => {
  const theme = useTheme();
  const [subjectData, setSubjectData] = useState(getSubjectData(homework.subject));

  useEffect(() => {
    const data = getSubjectData(homework.subject);
    setSubjectData(data);
  }, [homework.subject]);

  const [isLoading, setIsLoading] = useState(false);

  const handlePress = useCallback(() => {
    setIsLoading(true);
    onDonePressHandler();
  }, [onDonePressHandler]);

  const [mainLoaded, setMainLoaded] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    setMainLoaded(true);
  }, [homework.done]);

  const parsedContent = useMemo(() => parse_homeworks(homework.content), [homework.content]);

  const [expanded, setExpanded] = useState(false);

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withTiming(expanded ? "180deg" : "0deg") }],
    };
  });

  const [needsExpansion, setNeedsExpansion] = useState(false);

  const onTextLayout = useCallback(e => {
    const linesNumber = e.nativeEvent.lines.length;
    setNeedsExpansion(linesNumber > 3);
  }, []);

  return (
    <NativeItem
      separator={index !== total - 1}
      leading={
        <PapillonCheckbox
          checked={homework.done}
          loading={isLoading}
          onPress={handlePress}
          style={{ marginRight: 1 }}
          color={subjectData.color}
          loaded={mainLoaded}
        />
      }
    >
      <TouchableOpacity
        onPress={() => needsExpansion && setExpanded(!expanded)}
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
      >
        <View style={{ flex: 1 }}>
          <NativeText variant="overtitle" style={{ color: subjectData.color }} numberOfLines={1}>
            {subjectData.pretty}
          </NativeText>
          <NativeText
            variant="default"
            numberOfLines={expanded ? undefined : 3}
            onTextLayout={onTextLayout}
            style={{color: homework.done ? theme.colors.text + "70" : theme.colors.text}}
          >
            {parsedContent}
          </NativeText>
        </View>
        {needsExpansion && (
          <Animated.View style={[{ marginLeft: 8 }, rotateStyle]}>
            {expanded ? (
              <ChevronUp size={20} color={theme.colors.text} />
            ) : (
              <ChevronDown size={20} color={theme.colors.text} />
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </NativeItem>
  );
}, (prevProps, nextProps) => prevProps.index === nextProps.index);

export default HomeworkItem;