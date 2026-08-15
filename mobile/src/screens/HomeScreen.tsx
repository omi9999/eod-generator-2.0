import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { reportService } from '../services/reportService';

const schema = z.object({
  tasks: z.string().min(1, 'Tasks are required'),
  employee_name: z.string().min(1, 'Employee name is required'),
  position: z.string().min(1, 'Position is required'),
  provider: z.enum(['Groq (Fastest)', 'OpenAI (ChatGPT)', 'Google Gemini', 'Ollama (local)']),
});

type FormData = z.infer<typeof schema>;

const TEMPLATES = {
  'Social Media & Content': 'Created 3 Instagram stories, replied to comments...',
  'Meetings & Documentation': 'Attended 2 meetings, wrote meeting notes...',
  'Development & Testing': 'Fixed 3 bugs, deployed new feature...',
};

export function HomeScreen({ navigation }: any) {
  const [selectedTemplate, setSelectedTemplate] = useState('Custom');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const { control, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: 'Groq (Fastest)',
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: reportService.getEmployees,
  });

  const generateMutation = useMutation({
    mutationFn: reportService.generateReport,
    onSuccess: (data) => {
      navigation.navigate('ReportPreview', { report: data.report });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to generate report');
    },
  });

  const onSubmit = (data: FormData) => {
    generateMutation.mutate({
      ...data,
      report_date: date.toISOString().split('T')[0],
    });
  };

  const loadTemplate = (template: string) => {
    if (template !== 'Custom' && TEMPLATES[template as keyof typeof TEMPLATES]) {
      setValue('tasks', TEMPLATES[template as keyof typeof TEMPLATES]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Generate Report</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Employee Name</Text>
          <Controller
            control={control}
            name="employee_name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter employee name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Position</Text>
          <Controller
            control={control}
            name="position"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter position"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Quick Template</Text>
          <Picker
            selectedValue={selectedTemplate}
            onValueChange={(itemValue) => {
              setSelectedTemplate(itemValue);
              loadTemplate(itemValue);
            }}
          >
            {Object.keys(TEMPLATES).map((key) => (
              <Picker.Item key={key} label={key} value={key} />
            ))}
          </Picker>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Today's Tasks</Text>
          <Controller
            control={control}
            name="tasks"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what you did today..."
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🚀 Generate Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});